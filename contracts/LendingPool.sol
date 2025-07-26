// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

contract LendingPool {
    struct Loan {
        uint256 circleId;
        uint256 amount;
        uint256 interestRate;
        uint256 duration;
        uint256 dueDate;
    }
    
    uint256 public loanCount; // Counter to generate unique loan IDs
    mapping(uint256 => Loan) public loans;
    
    function createLoan(
        uint256 circleId,
        uint256 amount,
        uint256 interestRate,
        uint256 duration
    ) external {
        loanCount++; // Increment the loan counter
        uint256 loanId = loanCount; // Assign the new unique ID

        // Transfer funds from circle to pool would happen here in a real implementation

        loans[loanId] = Loan(
            circleId,
            amount,
            interestRate,
            duration,
            block.timestamp + duration
        );
    }
}