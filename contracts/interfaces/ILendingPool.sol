// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface ILendingPool {
    // Loan status enumeration
    enum LoanStatus { PENDING, ACTIVE, REPAID, DEFAULTED }
    
    // Loan structure
    struct Loan {
        uint256 circleId;
        address borrower;
        uint256 amount;
        uint256 interestRate;
        uint256 duration;
        uint256 dueDate;
        LoanStatus status;
        uint256 amountRepaid;
    }
    
    // Events
    event LoanRequested(
        uint256 indexed loanId,
        uint256 indexed circleId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 duration
    );
    
    event LoanApproved(
        uint256 indexed loanId,
        address indexed approver,
        uint256 timestamp
    );
    
    event LoanRepaid(
        uint256 indexed loanId,
        uint256 amount,
        uint256 timestamp
    );
    
    event LoanDefaulted(
        uint256 indexed loanId,
        uint256 amountOwed,
        uint256 timestamp
    );
    
    // Functions
    function requestLoan(
        uint256 circleId,
        address borrower,
        uint256 amount,
        uint256 duration
    ) external;
    
    function approveLoan(uint256 loanId) external;
    
    function repayLoan(uint256 loanId) external payable;
    
    function liquidateLoan(uint256 loanId) external;
    
    function getLoan(uint256 loanId) external view returns (
        uint256 circleId,
        address borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 duration,
        uint256 dueDate,
        LoanStatus status,
        uint256 amountRepaid
    );
    
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory);
    
    function getCircleLoans(uint256 circleId) external view returns (uint256[] memory);
    
    function calculateInterest(uint256 loanId) external view returns (uint256);
    
    function setRiskModel(address riskModel) external;
    
    function setLiquidationThreshold(uint256 threshold) external;
}