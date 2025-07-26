// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury {
    using SafeERC20 for IERC20;
    
    address public governance;
    mapping(address => uint256) public balances;

    constructor(address _governance) {
        governance = _governance;
    }

    // This receive function allows the contract to accept direct Ether transfers,
    // such as the protocol fees sent from the ContributionEngine.
    receive() external payable {}
    
    function withdraw(
        address token,
        uint256 amount,
        address recipient
    ) external {
        require(msg.sender == governance, "Unauthorized");
        IERC20(token).safeTransfer(recipient, amount);
    }
    
    function distributeFees() external {
        uint256 amount = address(this).balance / 10;
        (bool success,) = governance.call{value: amount}("");
        require(success, "Transfer failed");
    }
}