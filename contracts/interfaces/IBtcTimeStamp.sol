// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface IBtcTimestamp {
    function verifyTimestamp(uint256 timestamp) external returns (uint256 btcBlockHeight);
}