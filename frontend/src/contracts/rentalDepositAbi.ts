// Généré par `npm run abi` depuis artifacts/contracts/RentalDeposit.sol : ne pas modifier à la main.
export const rentalDepositAbi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "claimWindow_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "responseWindow_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "arbitrationWindow_",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ArbitrationWindowExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "ArbitrationWindowOpen",
    type: "error",
  },
  {
    inputs: [],
    name: "ClaimWindowExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "ClaimWindowOpen",
    type: "error",
  },
  {
    inputs: [],
    name: "EndDateInPast",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidArbiter",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidClaimAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSplit",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidTenant",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidWindow",
    type: "error",
  },
  {
    inputs: [],
    name: "LeaseNotEnded",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "LeaseNotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "NotArbiter",
    type: "error",
  },
  {
    inputs: [],
    name: "NotImplemented",
    type: "error",
  },
  {
    inputs: [],
    name: "NotLandlord",
    type: "error",
  },
  {
    inputs: [],
    name: "NotTenant",
    type: "error",
  },
  {
    inputs: [],
    name: "NothingToWithdraw",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [],
    name: "ResponseWindowExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "ResponseWindowOpen",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "sent",
        type: "uint256",
      },
    ],
    name: "WrongDepositAmount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
      {
        internalType: "enum RentalDeposit.Status",
        name: "current",
        type: "uint8",
      },
      {
        internalType: "enum RentalDeposit.Status",
        name: "expected",
        type: "uint8",
      },
    ],
    name: "WrongStatus",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroDeposit",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "afterTimeout",
        type: "bool",
      },
    ],
    name: "ClaimAccepted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "ClaimDisputed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "claimAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "refundedToTenant",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "claimHash",
        type: "bytes32",
      },
    ],
    name: "DepositClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "afterTimeout",
        type: "bool",
      },
    ],
    name: "DepositReleased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "toLandlord",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "toTenant",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "afterTimeout",
        type: "bool",
      },
    ],
    name: "DisputeResolved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "LeaseCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "landlord",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "tenant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "arbiter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "deposit",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "endDate",
        type: "uint64",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "leaseHash",
        type: "bytes32",
      },
    ],
    name: "LeaseCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "LeaseFunded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "acceptAfterTimeout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "acceptClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "arbitrationWindow",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balances",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "claimAmount",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "claimHash",
        type: "bytes32",
      },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimWindow",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tenant",
        type: "address",
      },
      {
        internalType: "address",
        name: "arbiter",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "deposit",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "endDate",
        type: "uint64",
      },
      {
        internalType: "bytes32",
        name: "leaseHash",
        type: "bytes32",
      },
    ],
    name: "createLease",
    outputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "dispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "fund",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "getLease",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "landlord",
            type: "address",
          },
          {
            internalType: "address",
            name: "tenant",
            type: "address",
          },
          {
            internalType: "address",
            name: "arbiter",
            type: "address",
          },
          {
            internalType: "enum RentalDeposit.Status",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "uint64",
            name: "endDate",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "claimedAt",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "disputedAt",
            type: "uint64",
          },
          {
            internalType: "uint256",
            name: "deposit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "claimAmount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "leaseHash",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "claimHash",
            type: "bytes32",
          },
        ],
        internalType: "struct RentalDeposit.Lease",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "leaseCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "refundAfterTimeout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "releaseAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "toLandlord",
        type: "uint256",
      },
    ],
    name: "resolve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "leaseId",
        type: "uint256",
      },
    ],
    name: "resolveAfterTimeout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "responseWindow",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
