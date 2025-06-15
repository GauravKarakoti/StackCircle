// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBtcTimeStamp.sol";

contract BtcTimestampMock is IBtcTimestamp {
    uint256 public blockHeight = 123456;
    
    function verifyTimestamp(uint256) external override returns (uint256) {
        return blockHeight++;
    }
}