// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RentalDeposit — dépôt de garantie locative (sujet escrow)
/// @notice Le locataire bloque la caution dans ce contrat. À la fin du bail, le
/// propriétaire peut réclamer tout ou partie de la caution ; la part non réclamée
/// revient au locataire, et un arbitre désigné à la création tranche le montant
/// contesté. Chaque délai expiré peut être déclenché par n'importe qui.
/// @dev Aucun owner, aucune pause, aucun upgrade : le déployeur ne fixe que les
/// délais, puis n'a plus aucun pouvoir. Les transitions créditent des soldes
/// (pull payments) ; seul `withdraw` envoie de l'ETH.
///
/// Convention des délais (à respecter dans toutes les fonctions) :
/// - une action « dans le délai » est permise tant que `block.timestamp <= deadline` ;
/// - la fonction `...AfterTimeout` correspondante est permise si `block.timestamp > deadline`.
/// Les deux ne peuvent donc jamais être possibles au même moment.
///
/// Les fonctions qui revert avec `NotImplemented` sont à écrire par la partie indiquée.
contract RentalDeposit is ReentrancyGuard {
    // ------------------------------------------------------------------
    // Types
    // ------------------------------------------------------------------

    enum Status {
        Proposed, // créé par le propriétaire, en attente du versement
        Active, // caution versée et bloquée
        Claimed, // le propriétaire a réclamé une partie ou la totalité
        Disputed, // le locataire conteste, l'arbitre doit trancher
        Closed, // fonds répartis (soldes crédités)
        Cancelled // annulé avant versement
    }

    struct Lease {
        address landlord; // msg.sender de createLease
        address tenant; // seule adresse autorisée à verser la caution
        address arbiter; // distinct du propriétaire et du locataire
        Status status;
        uint64 endDate; // aucune réclamation avant cette date
        uint64 claimedAt; // début de responseWindow (0 tant qu'il n'y a pas de réclamation)
        uint64 disputedAt; // début de arbitrationWindow (0 tant qu'il n'y a pas de litige)
        uint256 deposit; // montant exact attendu, en wei
        uint256 claimAmount; // 0 < claimAmount <= deposit une fois réclamé
        bytes32 leaseHash; // hash du bail et de l'état des lieux d'entrée (hors chaîne)
        bytes32 claimHash; // hash des justificatifs de la réclamation (hors chaîne)
    }

    // ------------------------------------------------------------------
    // Configuration fixée au déploiement
    // ------------------------------------------------------------------

    /// @notice Durée après `endDate` pendant laquelle le propriétaire peut réclamer.
    uint256 public immutable claimWindow;
    /// @notice Durée après la réclamation pendant laquelle le locataire peut accepter ou contester.
    uint256 public immutable responseWindow;
    /// @notice Durée après la contestation pendant laquelle l'arbitre peut trancher.
    uint256 public immutable arbitrationWindow;

    // ------------------------------------------------------------------
    // État
    // ------------------------------------------------------------------

    /// @notice Nombre de baux créés. Les identifiants vont de 1 à `leaseCount`.
    uint256 public leaseCount;

    mapping(uint256 leaseId => Lease) private _leases;

    /// @notice Solde retirable de chaque bénéficiaire, crédité par les transitions.
    mapping(address account => uint256) public balances;

    // ------------------------------------------------------------------
    // Événements
    // ------------------------------------------------------------------

    event LeaseCreated(
        uint256 indexed leaseId,
        address indexed landlord,
        address indexed tenant,
        address arbiter,
        uint256 deposit,
        uint64 endDate,
        bytes32 leaseHash
    );
    event LeaseCancelled(uint256 indexed leaseId);
    event LeaseFunded(uint256 indexed leaseId, uint256 amount);
    /// @param afterTimeout vrai si déclenché par `refundAfterTimeout`, faux pour `releaseAll`.
    event DepositReleased(uint256 indexed leaseId, uint256 amount, bool afterTimeout);
    /// @param refundedToTenant part non réclamée, créditée au locataire immédiatement.
    event DepositClaimed(
        uint256 indexed leaseId,
        uint256 claimAmount,
        uint256 refundedToTenant,
        bytes32 claimHash
    );
    /// @param afterTimeout vrai si déclenché par `acceptAfterTimeout`.
    event ClaimAccepted(uint256 indexed leaseId, uint256 amount, bool afterTimeout);
    event ClaimDisputed(uint256 indexed leaseId);
    /// @param afterTimeout vrai si déclenché par `resolveAfterTimeout`.
    event DisputeResolved(
        uint256 indexed leaseId,
        uint256 toLandlord,
        uint256 toTenant,
        bool afterTimeout
    );
    event Withdrawn(address indexed account, uint256 amount);

    // ------------------------------------------------------------------
    // Erreurs (une par règle)
    // ------------------------------------------------------------------

    /// @dev Temporaire : marque les fonctions encore à écrire. À supprimer à la fin.
    error NotImplemented();

    error InvalidWindow();
    error LeaseNotFound(uint256 leaseId);
    error WrongStatus(uint256 leaseId, Status current, Status expected);

    error NotLandlord();
    error NotTenant();
    error NotArbiter();

    error InvalidTenant(); // adresse nulle ou égale au propriétaire
    error InvalidArbiter(); // adresse nulle, ou égale au propriétaire ou au locataire
    error ZeroDeposit();
    error EndDateInPast();
    error WrongDepositAmount(uint256 expected, uint256 sent);

    error LeaseNotEnded();
    error ClaimWindowExpired();
    error ClaimWindowOpen();
    error InvalidClaimAmount();

    error ResponseWindowExpired();
    error ResponseWindowOpen();

    error ArbitrationWindowExpired();
    error ArbitrationWindowOpen();
    error InvalidSplit();

    error NothingToWithdraw();
    error TransferFailed();

    // ------------------------------------------------------------------
    // Constructeur
    // ------------------------------------------------------------------

    /// @param claimWindow_ secondes après endDate pour réclamer (production : 60 jours)
    /// @param responseWindow_ secondes après la réclamation pour répondre (production : 14 jours)
    /// @param arbitrationWindow_ secondes après la contestation pour trancher (production : 30 jours)
    constructor(uint256 claimWindow_, uint256 responseWindow_, uint256 arbitrationWindow_) {
        if (claimWindow_ == 0 || responseWindow_ == 0 || arbitrationWindow_ == 0) {
            revert InvalidWindow();
        }
        claimWindow = claimWindow_;
        responseWindow = responseWindow_;
        arbitrationWindow = arbitrationWindow_;
    }

    // ------------------------------------------------------------------
    // Partie 1 — Cycle de vie du bail
    // ------------------------------------------------------------------

    /// @notice Crée un bail à l'état Proposed. L'appelant devient le propriétaire.
    /// @dev Vérifier : InvalidTenant, InvalidArbiter, ZeroDeposit, EndDateInPast.
    /// Incrémenter leaseCount, utiliser la nouvelle valeur comme identifiant.
    /// Émettre LeaseCreated.
    function createLease(
        address tenant,
        address arbiter,
        uint256 deposit,
        uint64 endDate,
        bytes32 leaseHash
    ) external returns (uint256 leaseId) {
        if (tenant == address(0) || tenant == msg.sender) revert InvalidTenant();
        if (arbiter == address(0) || arbiter == msg.sender || arbiter == tenant) {
            revert InvalidArbiter();
        }
        if (deposit == 0) revert ZeroDeposit();
        if (endDate <= block.timestamp) revert EndDateInPast();

        leaseId = ++leaseCount;
        Lease storage lease = _leases[leaseId];
        lease.landlord = msg.sender;
        lease.tenant = tenant;
        lease.arbiter = arbiter;
        lease.status = Status.Proposed;
        lease.endDate = endDate;
        lease.deposit = deposit;
        lease.leaseHash = leaseHash;

        emit LeaseCreated(leaseId, msg.sender, tenant, arbiter, deposit, endDate, leaseHash);
    }

    /// @notice Le propriétaire annule un bail pas encore financé (Proposed → Cancelled).
    /// @dev Vérifier : NotLandlord, WrongStatus. Émettre LeaseCancelled.
    function cancel(uint256 leaseId) external {
        Lease storage lease = _getLease(leaseId);
        if (msg.sender != lease.landlord) revert NotLandlord();
        _requireStatus(leaseId, lease, Status.Proposed);

        lease.status = Status.Cancelled;
        emit LeaseCancelled(leaseId);
    }

    /// @notice Le locataire verse la caution exacte (Proposed → Active).
    /// @dev Vérifier : NotTenant, WrongStatus, WrongDepositAmount (msg.value == deposit).
    /// Émettre LeaseFunded.
    function fund(uint256 leaseId) external payable {
        Lease storage lease = _getLease(leaseId);
        if (msg.sender != lease.tenant) revert NotTenant();
        _requireStatus(leaseId, lease, Status.Proposed);
        if (msg.value != lease.deposit) revert WrongDepositAmount(lease.deposit, msg.value);

        lease.status = Status.Active;
        emit LeaseFunded(leaseId, msg.value);
    }

    // ------------------------------------------------------------------
    // Partie 2 — Réclamations et délais
    // ------------------------------------------------------------------

    /// @notice Le propriétaire rend toute la caution (Active → Closed).
    /// @dev Vérifier : NotLandlord, WrongStatus. Créditer deposit au locataire.
    /// Émettre DepositReleased(afterTimeout = false).
    function releaseAll(uint256 leaseId) external {
        Lease storage lease = _getLease(leaseId);
        if (msg.sender != lease.landlord) revert NotLandlord();
        _requireStatus(leaseId, lease, Status.Active);

        lease.status = Status.Closed;
        _credit(lease.tenant, lease.deposit);
        emit DepositReleased(leaseId, lease.deposit, false);
    }

    /// @notice Le propriétaire réclame claimAmount sur justificatifs (Active → Claimed).
    /// @dev Vérifier : NotLandlord, WrongStatus, LeaseNotEnded (avant endDate),
    /// ClaimWindowExpired (après endDate + claimWindow), InvalidClaimAmount.
    /// Créditer immédiatement deposit - claimAmount au locataire, enregistrer
    /// claimedAt. Émettre DepositClaimed.
    function claim(uint256 leaseId, uint256 claimAmount, bytes32 claimHash) external {
        Lease storage lease = _getLease(leaseId);
        if (msg.sender != lease.landlord) revert NotLandlord();
        _requireStatus(leaseId, lease, Status.Active);
        if (block.timestamp < lease.endDate) revert LeaseNotEnded();
        if (block.timestamp > lease.endDate + claimWindow) revert ClaimWindowExpired();
        if (claimAmount == 0 || claimAmount > lease.deposit) revert InvalidClaimAmount();

        uint256 refundedToTenant = lease.deposit - claimAmount;
        lease.status = Status.Claimed;
        lease.claimAmount = claimAmount;
        lease.claimHash = claimHash;
        lease.claimedAt = uint64(block.timestamp);
        _credit(lease.tenant, refundedToTenant);

        emit DepositClaimed(leaseId, claimAmount, refundedToTenant, claimHash);
    }

    /// @notice Le locataire accepte la réclamation (Claimed → Closed).
    /// @dev Vérifier : NotTenant, WrongStatus. Créditer claimAmount au propriétaire.
    /// Émettre ClaimAccepted(afterTimeout = false).
    function acceptClaim(uint256 leaseId) external {
        Lease storage lease = _getLease(leaseId);
        if (msg.sender != lease.tenant) revert NotTenant();
        _requireStatus(leaseId, lease, Status.Claimed);

        lease.status = Status.Closed;
        _credit(lease.landlord, lease.claimAmount);
        emit ClaimAccepted(leaseId, lease.claimAmount, false);
    }

    /// @notice N'importe qui : le propriétaire n'a pas réclamé à temps (Active → Closed).
    /// @dev Vérifier : WrongStatus, ClaimWindowOpen. Tout au locataire.
    /// Émettre DepositReleased(afterTimeout = true).
    function refundAfterTimeout(uint256 leaseId) external {
        Lease storage lease = _getLease(leaseId);
        _requireStatus(leaseId, lease, Status.Active);
        if (block.timestamp <= lease.endDate + claimWindow) revert ClaimWindowOpen();

        lease.status = Status.Closed;
        _credit(lease.tenant, lease.deposit);
        emit DepositReleased(leaseId, lease.deposit, true);
    }

    /// @notice N'importe qui : le locataire n'a pas répondu à temps (Claimed → Closed).
    /// @dev Vérifier : WrongStatus, ResponseWindowOpen. claimAmount au propriétaire.
    /// Émettre ClaimAccepted(afterTimeout = true).
    function acceptAfterTimeout(uint256 leaseId) external {
        Lease storage lease = _getLease(leaseId);
        _requireStatus(leaseId, lease, Status.Claimed);
        if (block.timestamp <= lease.claimedAt + responseWindow) revert ResponseWindowOpen();

        lease.status = Status.Closed;
        _credit(lease.landlord, lease.claimAmount);
        emit ClaimAccepted(leaseId, lease.claimAmount, true);
    }

    /// @notice N'importe qui : l'arbitre n'a pas tranché à temps (Disputed → Closed).
    /// @dev Vérifier : WrongStatus, ArbitrationWindowOpen. Règle par défaut retenue :
    /// le montant contesté revient au locataire. Émettre DisputeResolved(0, claimAmount, true).
    function resolveAfterTimeout(uint256 leaseId) external {
        Lease storage lease = _getLease(leaseId);
        _requireStatus(leaseId, lease, Status.Disputed);
        if (block.timestamp <= lease.disputedAt + arbitrationWindow) revert ArbitrationWindowOpen();

        lease.status = Status.Closed;
        _credit(lease.tenant, lease.claimAmount);
        emit DisputeResolved(leaseId, 0, lease.claimAmount, true);
    }

    // ------------------------------------------------------------------
    // Partie 3 — Litiges et arbitrage
    // ------------------------------------------------------------------

    /// @notice Le locataire conteste la réclamation (Claimed → Disputed).
    /// @dev Vérifier : NotTenant, WrongStatus, ResponseWindowExpired.
    /// Enregistrer disputedAt. Émettre ClaimDisputed.
    function dispute(uint256 leaseId) external {
        _getLease(leaseId);
        revert NotImplemented();
    }

    /// @notice L'arbitre répartit le montant contesté (Disputed → Closed).
    /// @dev Vérifier : NotArbiter, WrongStatus, ArbitrationWindowExpired,
    /// InvalidSplit (toLandlord > claimAmount). Le reste du claimAmount va au
    /// locataire ; l'arbitre ne touche jamais à la part non contestée.
    /// Émettre DisputeResolved(toLandlord, claimAmount - toLandlord, false).
    function resolve(uint256 leaseId, uint256 toLandlord) external {
        _getLease(leaseId);
        toLandlord;
        revert NotImplemented();
    }

    // ------------------------------------------------------------------
    // Retrait (pull payment)
    // ------------------------------------------------------------------

    /// @notice Retire la totalité de son solde crédité.
    /// @dev Checks-effects-interactions : le solde est remis à zéro AVANT l'envoi,
    /// donc un appel réentrant trouve un solde nul. `nonReentrant` bloque en plus
    /// toute réentrance dans les fonctions protégées. `call` transmet tout le gaz
    /// disponible (contrairement à `transfer`, limité à 2300 gaz), ce qui permet
    /// aux portefeuilles-contrats de recevoir les fonds.
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        balances[msg.sender] = 0;
        emit Withdrawn(msg.sender, amount);

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    // ------------------------------------------------------------------
    // Lecture
    // ------------------------------------------------------------------

    /// @notice Renvoie toutes les données d'un bail. Revert si le bail n'existe pas,
    /// pour qu'une lecture invalide ne ressemble jamais à un bail vide.
    function getLease(uint256 leaseId) external view returns (Lease memory) {
        return _getLease(leaseId);
    }

    // ------------------------------------------------------------------
    // Utilitaires internes partagés
    // ------------------------------------------------------------------

    /// @dev Pointeur vers le bail en stockage ; revert LeaseNotFound s'il n'existe pas.
    /// Un bail existe dès que son propriétaire est non nul (createLease le fixe toujours).
    function _getLease(uint256 leaseId) internal view returns (Lease storage lease) {
        lease = _leases[leaseId];
        if (lease.landlord == address(0)) revert LeaseNotFound(leaseId);
    }

    /// @dev Revert WrongStatus si le bail n'est pas dans l'état attendu.
    function _requireStatus(uint256 leaseId, Lease storage lease, Status expected) internal view {
        if (lease.status != expected) revert WrongStatus(leaseId, lease.status, expected);
    }

    /// @dev Crédite un bénéficiaire. Seule façon d'attribuer des fonds : l'ETH ne sort
    /// du contrat que par `withdraw`.
    function _credit(address account, uint256 amount) internal {
        balances[account] += amount;
    }
}
