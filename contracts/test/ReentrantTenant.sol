// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// Fonctions de RentalDeposit qu'un locataire-contrat appelle.
interface IRentalDepositTenantSide {
    function fund(uint256 leaseId) external payable;
    function withdraw() external;
}

/// Test uniquement. Un locataire dont le `receive` rappelle `withdraw` pendant que le
/// premier retrait est encore en cours, pour toucher plus que son dû.
contract ReentrantTenant {
    IRentalDepositTenantSide public immutable target;
    uint256 public reentries;

    constructor(address target_) {
        target = IRentalDepositTenantSide(target_);
    }

    function fund(uint256 leaseId) external payable {
        target.fund{value: msg.value}(leaseId);
    }

    function attack() external {
        target.withdraw();
    }

    receive() external payable {
        if (address(target).balance >= msg.value) {
            reentries += 1;
            target.withdraw();
        }
    }
}

/// Test uniquement. Un locataire qui ne peut pas recevoir d'ETH : ni `receive` ni `fallback`.
contract RejectingTenant {
    IRentalDepositTenantSide public immutable target;

    constructor(address target_) {
        target = IRentalDepositTenantSide(target_);
    }

    function fund(uint256 leaseId) external payable {
        target.fund{value: msg.value}(leaseId);
    }

    function withdraw() external {
        target.withdraw();
    }
}

/// Test uniquement. Le retrait que ce projet ne doit pas écrire : il envoie avant de remettre
/// le solde à zéro, sans garde. Il prouve que ReentrantTenant est un attaquant qui fonctionne,
/// pour que son échec contre RentalDeposit ait un sens.
contract VulnerableVault {
    mapping(address account => uint256) public balances;

    function credit(address account) external payable {
        balances[account] += msg.value;
    }

    function fund(uint256) external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing to withdraw");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "transfer failed");
        balances[msg.sender] = 0;
    }
}
