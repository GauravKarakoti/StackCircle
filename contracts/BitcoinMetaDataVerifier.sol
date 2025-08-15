// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract BitcoinMetadataVerifier {
    struct SPVProof {
        bytes32 merkleRoot;
        bytes32 txHash;
        uint256 blockHeight;
        bytes32[] merkleProof;
        uint256 index; // Note: OpenZeppelin's library doesn't need the index
    }

    function verifyMetadata(SPVProof calldata proof) external pure returns (bool) {
        // The leaf must be hashed first to be verified against the proof
        bytes32 leaf = sha256(abi.encodePacked(proof.txHash));

        // The OpenZeppelin library's `verify` function is more direct
        bool isValid = MerkleProof.verify(
            proof.merkleProof,
            proof.merkleRoot,
            leaf
        );
        
        require(isValid, "Invalid merkle proof");
        return true;
    }
}