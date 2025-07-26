// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StackToken is ERC20, Ownable {
    // Call both parent constructors here
    constructor() ERC20("StackCircle", "STACK") Ownable(msg.sender) {
        _mint(msg.sender, 10_000_000 * 10**decimals());
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}