// SPDX-License-Identifier: CC0

pragma solidity ^0.8.0;

import './Structures.sol';

library Utils {
    bytes32 public constant ZERO = bytes32(0);
    uint256 constant TRANSACTIONS_BATCH_SIZE = 6; // TODO Change this from 2 to an appropriate value to control stack too deep error

    function hashTransaction(Structures.Transaction memory t) internal pure returns (bytes32) {
        return keccak256(abi.encode(t));
    }

    function hashBlock(Structures.Block memory b) internal pure returns (bytes32) {
        return keccak256(abi.encode(b));
    }

    function hashTransactionHashes(Structures.Transaction[] memory ts)
        public
        pure
        returns (bytes32)
    {
        bytes32 transactionHashesRoot;
        bytes32[] memory transactionHashes = new bytes32[](ts.length);

        for (uint256 i = 0; i < ts.length; i++) {
            transactionHashes[i ] = hashTransaction(ts[i]);
        }
        transactionHashesRoot = calculateMerkleRoot(transactionHashes);
        return transactionHashesRoot;
    }

    function compressG1(uint256 x, uint256 y) internal pure returns (uint256) {
        // compute whether y is odd or even and multiply by 2**255
        uint256 parity =
            0x8000000000000000000000000000000000000000000000000000000000000000 * (y % 2);
        // add the parity bit to the x cordinate (x,y are 254 bits long - the final
        // number is 256 bits to fit with an Ethereum word)
        return parity + x;
    }

    function compressG2(
        uint256 xr,
        uint256 xi,
        uint256 yr,
        uint256 yi
    ) internal pure returns (uint256, uint256) {
        return (compressG1(xr, yr), compressG1(xi, yi));
    }

    function compressProof(uint256[8] memory proof) internal pure returns (uint256[4] memory) {
        uint256 a = compressG1(proof[0], proof[1]);
        (uint256 rb, uint256 ib) = compressG2(proof[2], proof[3], proof[4], proof[5]);
        uint256 c = compressG1(proof[6], proof[7]);
        return [a, rb, ib, c];
    }

    // counts the number of non-zero values (useful for counting real commitments and nullifiers)
    function countNonZeroValues(bytes32[2] memory vals) internal pure returns (uint256) {
        uint256 count;
        if (vals[0] != ZERO) count++;
        if (vals[1] != ZERO) count++;
        return count;
    }

    // filters the number of non-zero values (useful for getting real commitments and nullifiers)
    function filterNonZeroValues(bytes32[2] memory vals) internal pure returns (bytes32[] memory) {
        bytes32[] memory filtered = new bytes32[](countNonZeroValues(vals));
        uint256 count;
        if (vals[0] != ZERO) filtered[count++] = vals[0]; // a bit faster than looping?
        if (vals[1] != ZERO) filtered[count++] = vals[1];
        return filtered;
    }

    // counts the number of non-zero commitments in a block containing the ts transactions)
    function countCommitments(Structures.Transaction[] memory ts) internal pure returns (uint256) {
        uint256 count;
        for (uint256 i = 0; i < ts.length; i++) {
            count += countNonZeroValues(ts[i].commitments);
        }
        return count;
    }

    // filters the non-zero commitments in a block containing the ts transactions)
    function filterCommitments(Structures.Transaction[] memory ts)
        internal
        pure
        returns (bytes32[] memory)
    {
        bytes32[] memory filtered = new bytes32[](countCommitments(ts));
        uint256 count;
        for (uint256 i = 0; i < ts.length; i++) {
            if (ts[i].commitments[0] != ZERO) filtered[count++] = ts[i].commitments[0];
            if (ts[i].commitments[1] != ZERO) filtered[count++] = ts[i].commitments[1];
        }
        return filtered;
    }

    // gathers public inputs for each tx type
    // required now we have removed the publicInputHash
    function getPublicInputs(Structures.Transaction calldata ts, uint256[2] memory roots)
        internal
        pure
        returns (uint256[] memory inputs)
    {
        // uint256[] memory inputs = new uint256[](countPublicInputs(ts));
        if (ts.transactionType == Structures.TransactionTypes.DEPOSIT) {
            inputs = getDepositInputs(ts);
        } else if (ts.transactionType == Structures.TransactionTypes.SINGLE_TRANSFER) {
            inputs = getSingleTransferInputs(ts, roots);
        } else if (ts.transactionType == Structures.TransactionTypes.DOUBLE_TRANSFER) {
            inputs = getDoubleTransferInputs(ts, roots);
        } else {
            inputs = getWithdrawInputs(ts, roots);
        }
    }

    function getDepositInputs(Structures.Transaction calldata ts)
        internal
        pure
        returns (uint256[] memory)
    {
        uint256[] memory inputs = new uint256[](4);
        inputs[0] = uint256(ts.ercAddress);
        inputs[1] = uint256(ts.tokenId);
        inputs[2] = ts.value;
        inputs[3] = uint256(ts.commitments[0]);
        return inputs;
    }

    function getSingleTransferInputs(Structures.Transaction calldata ts, uint256[2] memory roots)
        internal
        pure
        returns (uint256[] memory)
    {
        uint256[] memory inputs = new uint256[](12);
        inputs[0] = uint256(ts.ercAddress);
        inputs[1] = uint256(ts.commitments[0]);
        inputs[2] = uint256(ts.nullifiers[0]);
        inputs[3] = roots[0];
        for (uint256 i = 4; i < 12; i++) {
            inputs[i] = uint256(ts.compressedSecrets[i - 4]);
        }
        return inputs;
    }

    function getWithdrawInputs(Structures.Transaction calldata ts, uint256[2] memory roots)
        internal
        pure
        returns (uint256[] memory)
    {
        uint256[] memory inputs = new uint256[](6);
        inputs[0] = uint256(ts.ercAddress);
        inputs[1] = uint256(ts.tokenId);
        inputs[2] = ts.value;
        inputs[3] = uint256(ts.nullifiers[0]);
        inputs[4] = uint256(ts.recipientAddress);
        inputs[5] = roots[0];
        return inputs;
    }

    function getDoubleTransferInputs(Structures.Transaction calldata ts, uint256[2] memory roots)
        internal
        pure
        returns (uint256[] memory)
    {
        uint256[] memory inputs = new uint256[](16);
        inputs[0] = uint256(ts.ercAddress);
        inputs[1] = uint256(ts.ercAddress);
        inputs[2] = uint256(ts.commitments[0]);
        inputs[3] = uint256(ts.commitments[1]);
        inputs[4] = uint256(ts.nullifiers[0]);
        inputs[5] = uint256(ts.nullifiers[1]);
        inputs[6] = roots[0];
        inputs[7] = roots[1];
        for (uint256 i = 8; i < 16; i++) {
            inputs[i] = uint256(ts.compressedSecrets[i - 8]);
        }
        return inputs;
    }

    function calculateMerkleRoot(bytes32[] memory leaves) public pure returns (bytes32 result) {
        assembly {
            let length := mload(leaves)
            let leavesPos := add(leaves,0x20)
            let transactionHashesPos := mload(0x40)
            for {
                let i := 0
            } lt(i, length) {
                i := add(i, 1)
            } {
                mstore(
                    add(transactionHashesPos, mul(0x20, i)),
                    mload(add(leavesPos, mul(0x20, i)))
                )
            }
            for {
                let i := 5
            } gt(i, 0) {
                i := sub(i, 1)
            } {
                for {
                    let j := 0
                } lt(j, exp(2, sub(i, 1))) {
                    j := add(j, 1)
                } {
                    let left := mload(add(transactionHashesPos, mul(mul(0x20, j), 2)))
                    let right := mload(add(transactionHashesPos, add(mul(mul(0x20, j), 2), 0x20)))
                    if eq(and(iszero(left), iszero(right)), 1) {
                        result := 0
                    } // returns bool
                    if eq(and(iszero(left), iszero(right)), 0) {
                        result := keccak256(
                            add(transactionHashesPos, mul(mul(0x20, j), 2)),
                            0x40
                        )
                    } // returns bool
                    mstore(add(transactionHashesPos, mul(0x20, j)), result)
                }
            }
        }
    }

    function checkPath(
        bytes32[6] memory siblingPath,
        uint256 leafIndex,
        bytes32 node
    ) public pure returns (bool) {
        for (uint256 i = 5; i > 0; i--) {
            if (leafIndex % 2 == 0) {
                node = keccak256(abi.encodePacked(node, siblingPath[i]));
            } else {
                node = keccak256(abi.encodePacked(siblingPath[i], node));
            }
            leafIndex = leafIndex >> 1;
        }
        return (siblingPath[0] == node);
    }
}
