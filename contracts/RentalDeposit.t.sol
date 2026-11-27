// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {RentalDeposit} from "./RentalDeposit.sol";

/// Calls every public transition of RentalDeposit in a random order, with valid
/// callers and bounded values, so that the fuzzer explores long sequences of
/// leases instead of reverting on its first call. Calls that the contract
/// rejects are allowed: they must simply leave the accounting intact.
contract RentalDepositHandler is Test {
    RentalDeposit public immutable rentalDeposit;
    address public constant LANDLORD = address(0x1111);
    address public constant TENANT = address(0x2222);
    address public constant ARBITER = address(0x3333);

    constructor(RentalDeposit rentalDeposit_) {
        rentalDeposit = rentalDeposit_;
    }

    function createAndFund(uint256 depositSeed, uint256 durationSeed) external {
        uint256 deposit = bound(depositSeed, 1, 10 ether);
        uint64 endDate = uint64(block.timestamp + bound(durationSeed, 1, 3 days));
        vm.prank(LANDLORD);
        uint256 leaseId = rentalDeposit.createLease(TENANT, ARBITER, deposit, endDate, keccak256("bail"));
        vm.deal(TENANT, TENANT.balance + deposit);
        vm.prank(TENANT);
        rentalDeposit.fund{value: deposit}(leaseId);
    }

    function releaseAll(uint256 leaseSeed) external {
        vm.prank(LANDLORD);
        try rentalDeposit.releaseAll(_lease(leaseSeed)) {} catch {}
    }

    function claim(uint256 leaseSeed, uint256 amountSeed) external {
        uint256 leaseId = _lease(leaseSeed);
        RentalDeposit.Lease memory lease = _read(leaseId);
        if (lease.deposit == 0) return;
        if (block.timestamp < lease.endDate) vm.warp(lease.endDate);
        vm.prank(LANDLORD);
        try rentalDeposit.claim(leaseId, bound(amountSeed, 1, lease.deposit), keccak256("devis")) {} catch {}
    }

    function acceptClaim(uint256 leaseSeed) external {
        vm.prank(TENANT);
        try rentalDeposit.acceptClaim(_lease(leaseSeed)) {} catch {}
    }

    function dispute(uint256 leaseSeed) external {
        vm.prank(TENANT);
        try rentalDeposit.dispute(_lease(leaseSeed)) {} catch {}
    }

    function resolve(uint256 leaseSeed, uint256 shareSeed) external {
        uint256 leaseId = _lease(leaseSeed);
        uint256 claimAmount = _read(leaseId).claimAmount;
        vm.prank(ARBITER);
        try rentalDeposit.resolve(leaseId, bound(shareSeed, 0, claimAmount)) {} catch {}
    }

    function passTime(uint256 secondsSeed) external {
        vm.warp(block.timestamp + bound(secondsSeed, 1, 4 days));
    }

    function triggerTimeouts(uint256 leaseSeed, address caller) external {
        uint256 leaseId = _lease(leaseSeed);
        vm.startPrank(caller);
        try rentalDeposit.refundAfterTimeout(leaseId) {} catch {}
        try rentalDeposit.acceptAfterTimeout(leaseId) {} catch {}
        try rentalDeposit.resolveAfterTimeout(leaseId) {} catch {}
        vm.stopPrank();
    }

    function withdraw(uint256 actorSeed) external {
        address actor = [LANDLORD, TENANT, ARBITER][actorSeed % 3];
        vm.prank(actor);
        try rentalDeposit.withdraw() {} catch {}
    }

    function _lease(uint256 seed) private view returns (uint256) {
        uint256 count = rentalDeposit.leaseCount();
        return count == 0 ? 1 : bound(seed, 1, count);
    }

    function _read(uint256 leaseId) private view returns (RentalDeposit.Lease memory lease) {
        if (leaseId <= rentalDeposit.leaseCount()) lease = rentalDeposit.getLease(leaseId);
    }
}

contract RentalDepositInvariantTest is Test {
    RentalDeposit internal rentalDeposit;
    RentalDepositHandler internal handler;

    function setUp() public {
        rentalDeposit = new RentalDeposit(120, 120, 120);
        handler = new RentalDepositHandler(rentalDeposit);
        targetContract(address(handler));
    }

    /// The ETH the contract holds is exactly what it still owes: the amounts
    /// locked in open leases plus every credited balance. No transition can
    /// create or lose a wei.
    function invariant_balanceEqualsLockedPlusCredited() public view {
        uint256 locked;
        uint256 count = rentalDeposit.leaseCount();
        for (uint256 leaseId = 1; leaseId <= count; leaseId++) {
            RentalDeposit.Lease memory lease = rentalDeposit.getLease(leaseId);
            if (lease.status == RentalDeposit.Status.Active) locked += lease.deposit;
            else if (lease.status == RentalDeposit.Status.Claimed || lease.status == RentalDeposit.Status.Disputed) {
                // The unclaimed part was credited to the tenant at claim time.
                locked += lease.claimAmount;
            }
        }
        uint256 credited = rentalDeposit.balances(handler.LANDLORD()) + rentalDeposit.balances(handler.TENANT())
            + rentalDeposit.balances(handler.ARBITER());
        assertEq(address(rentalDeposit).balance, locked + credited);
    }

    /// The arbiter decides on the disputed amount but is never paid from it.
    function invariant_arbiterIsNeverCredited() public view {
        assertEq(rentalDeposit.balances(handler.ARBITER()), 0);
    }
}

contract RentalDepositFuzzTest is Test {
    RentalDeposit internal rentalDeposit;
    address internal constant LANDLORD = address(0x1111);
    address internal constant TENANT = address(0x2222);
    address internal constant ARBITER = address(0x3333);

    function setUp() public {
        rentalDeposit = new RentalDeposit(120, 120, 120);
    }

    /// For any deposit and any valid claim, the tenant is credited exactly the
    /// unclaimed part at once, and the claimed part is held until settled.
    function testFuzz_claimCreditsTheUnclaimedPartAtOnce(uint256 depositSeed, uint256 amountSeed) public {
        uint256 deposit = bound(depositSeed, 1, 1_000 ether);
        uint256 amount = bound(amountSeed, 1, deposit);
        uint64 endDate = uint64(block.timestamp + 1 days);

        vm.prank(LANDLORD);
        uint256 leaseId = rentalDeposit.createLease(TENANT, ARBITER, deposit, endDate, keccak256("bail"));
        vm.deal(TENANT, deposit);
        vm.prank(TENANT);
        rentalDeposit.fund{value: deposit}(leaseId);

        vm.warp(endDate);
        vm.prank(LANDLORD);
        rentalDeposit.claim(leaseId, amount, keccak256("devis"));

        assertEq(rentalDeposit.balances(TENANT), deposit - amount);
        assertEq(rentalDeposit.balances(LANDLORD), 0);
        assertEq(address(rentalDeposit).balance, deposit);
    }

    /// For any split the arbiter chooses, the claimed amount is shared exactly
    /// between the two parties and the unclaimed part is untouched.
    function testFuzz_resolveSplitsOnlyTheClaimedAmount(uint256 amountSeed, uint256 shareSeed) public {
        uint256 deposit = 1 ether;
        uint256 amount = bound(amountSeed, 1, deposit);
        uint256 share = bound(shareSeed, 0, amount);
        uint64 endDate = uint64(block.timestamp + 1 days);

        vm.prank(LANDLORD);
        uint256 leaseId = rentalDeposit.createLease(TENANT, ARBITER, deposit, endDate, keccak256("bail"));
        vm.deal(TENANT, deposit);
        vm.prank(TENANT);
        rentalDeposit.fund{value: deposit}(leaseId);
        vm.warp(endDate);
        vm.prank(LANDLORD);
        rentalDeposit.claim(leaseId, amount, keccak256("devis"));
        vm.prank(TENANT);
        rentalDeposit.dispute(leaseId);

        vm.prank(ARBITER);
        rentalDeposit.resolve(leaseId, share);

        assertEq(rentalDeposit.balances(LANDLORD), share);
        assertEq(rentalDeposit.balances(TENANT), deposit - share);
        assertEq(rentalDeposit.balances(ARBITER), 0);
    }
}
