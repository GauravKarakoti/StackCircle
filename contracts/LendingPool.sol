// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LendingPool {
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
    
    // State variables
    mapping(uint256 => Loan) public loans;
    uint256 public loanCount;
    IERC20 public circleToken;
    
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
    
    // Set token during deployment
    constructor(address _tokenAddress) {
        circleToken = IERC20(_tokenAddress);
    }
    
    function createLoan(
        uint256 circleId,
        uint256 amount,
        uint256 interestRate,
        uint256 duration
    ) external {
        loanCount++;
        uint256 loanId = loanCount;

        loans[loanId] = Loan({
            circleId: circleId,
            borrower: msg.sender,
            amount: amount,
            interestRate: interestRate,
            duration: duration,
            dueDate: 0,
            status: LoanStatus.PENDING,
            amountRepaid: 0
        });
        
        emit LoanRequested(loanId, circleId, msg.sender, amount, interestRate, duration);
    }
    
    function approveLoan(uint256 loanId) external {
        require(loans[loanId].status == LoanStatus.PENDING, "Not pending");
        
        loans[loanId].status = LoanStatus.ACTIVE;
        loans[loanId].dueDate = block.timestamp + loans[loanId].duration;
        
        // Transfer funds to borrower
        circleToken.transfer(loans[loanId].borrower, loans[loanId].amount);
        
        emit LoanApproved(loanId, msg.sender, block.timestamp);
    }
    
    function repayLoan(uint256 loanId, uint256 amount) external {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(block.timestamp <= loan.dueDate, "Loan expired");
        
        // Calculate payment with interest
        uint256 paymentDue = loan.amount + (loan.amount * loan.interestRate / 100);
        loan.amountRepaid += amount;
        
        if (loan.amountRepaid >= paymentDue) {
            loan.status = LoanStatus.REPAID;
        }
        
        circleToken.transferFrom(msg.sender, address(this), amount);
        emit LoanRepaid(loanId, amount, block.timestamp);
    }
    
    function liquidateLoan(uint256 loanId) external {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(block.timestamp > loan.dueDate, "Not expired yet");
        
        loan.status = LoanStatus.DEFAULTED;
        uint256 amountOwed = loan.amount + (loan.amount * loan.interestRate / 100);
        
        emit LoanDefaulted(loanId, amountOwed, block.timestamp);
    }
}