// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury {
    using SafeERC20 for IERC20;
    
    address public governance;
    address public stackToken;  // Added StackToken address reference
    
    constructor(address _governance, address _stackToken) {
        governance = _governance;
        stackToken = _stackToken;
    }

    // This receive function allows the contract to accept direct Ether transfers
    receive() external payable {}
    
    function withdraw(
        address token,
        uint256 amount,
        address recipient
    ) external {
        require(msg.sender == governance, "Unauthorized");
        IERC20(token).safeTransfer(recipient, amount);
    }
    
    // Updated to work with ETH and tokens
    function distributeFees() external {
        require(msg.sender == governance, "Unauthorized");
        
        // Distribute ETH fees (10% to governance)
        uint256 ethAmount = address(this).balance / 10;
        (bool success,) = governance.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        // Distribute token fees if StackToken is set
        if (stackToken != address(0)) {
            uint256 tokenBalance = IERC20(stackToken).balanceOf(address(this));
            IERC20(stackToken).safeTransfer(governance, tokenBalance);
        }
    }
}