// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISemaphore.sol";

contract SemaphoreMock is ISemaphore {
    function verifyProof(
        uint256, 
        SemaphoreProof calldata
    ) external pure override returns (bool) {
        return true; // Always returns valid for testing
    }

    // Minimal implementation for other functions
    function createGroup() external pure override returns (uint256) { return 0; }
    function createGroup(address) external pure override returns (uint256) { return 0; }
    function createGroup(address, uint256) external pure override returns (uint256) { return 0; }
    function updateGroupAdmin(uint256, address) external override {}
    function acceptGroupAdmin(uint256) external override {}
    function updateGroupMerkleTreeDuration(uint256, uint256) external override {}
    function addMember(uint256, uint256) external override {}
    function addMembers(uint256, uint256[] calldata) external override {}
    function updateMember(uint256, uint256, uint256, uint256[] calldata) external override {}
    function removeMember(uint256, uint256, uint256[] calldata) external override {}
    function validateProof(uint256, SemaphoreProof calldata) external override {}
    function groupCounter() external pure override returns (uint256) { return 0; }
}