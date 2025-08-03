// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SynapPay Ethereum HTLC
 * @dev Hash Time Locked Contract for cross-chain atomic swaps
 */
contract SynapPayHTLC {
    struct HTLCContract {
        address sender;
        address receiver;
        uint256 amount;
        bytes32 hashlock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
        address token; // ERC20 token address, 0x0 for ETH
    }

    mapping(bytes32 => HTLCContract) public contracts;
    
    event HTLCNew(
        bytes32 indexed contractId,
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        address token
    );
    
    event HTLCWithdraw(bytes32 indexed contractId);
    event HTLCRefund(bytes32 indexed contractId);

    modifier contractExists(bytes32 _contractId) {
        require(haveContract(_contractId), "Contract does not exist");
        _;
    }

    modifier withdrawable(bytes32 _contractId) {
        require(contracts[_contractId].receiver == msg.sender, "Withdrawable: not receiver");
        require(contracts[_contractId].withdrawn == false, "Withdrawable: already withdrawn");
        require(contracts[_contractId].refunded == false, "Withdrawable: already refunded");
        require(contracts[_contractId].timelock > block.timestamp, "Withdrawable: timelock time passed");
        _;
    }

    modifier refundable(bytes32 _contractId) {
        require(contracts[_contractId].sender == msg.sender, "Refundable: not sender");
        require(contracts[_contractId].refunded == false, "Refundable: already refunded");
        require(contracts[_contractId].withdrawn == false, "Refundable: already withdrawn");
        require(contracts[_contractId].timelock <= block.timestamp, "Refundable: timelock not yet passed");
        _;
    }

    function newContract(
        address _receiver,
        bytes32 _hashlock,
        uint256 _timelock,
        address _token
    ) external payable returns (bytes32 contractId) {
        contractId = keccak256(
            abi.encodePacked(
                msg.sender,
                _receiver,
                msg.value,
                _hashlock,
                _timelock,
                _token
            )
        );

        if (haveContract(contractId))
            revert("Contract already exists");

        contracts[contractId] = HTLCContract(
            msg.sender,
            _receiver,
            msg.value,
            _hashlock,
            _timelock,
            false,
            false,
            _token
        );

        emit HTLCNew(
            contractId,
            msg.sender,
            _receiver,
            msg.value,
            _hashlock,
            _timelock,
            _token
        );
    }

    function withdraw(bytes32 _contractId, bytes32 _preimage)
        external
        contractExists(_contractId)
        withdrawable(_contractId)
        returns (bool)
    {
        HTLCContract storage c = contracts[_contractId];
        require(c.hashlock == keccak256(abi.encodePacked(_preimage)), "Hashlock hash does not match");
        
        c.withdrawn = true;
        payable(c.receiver).transfer(c.amount);
        emit HTLCWithdraw(_contractId);
        return true;
    }

    function refund(bytes32 _contractId)
        external
        contractExists(_contractId)
        refundable(_contractId)
        returns (bool)
    {
        HTLCContract storage c = contracts[_contractId];
        c.refunded = true;
        
        payable(c.sender).transfer(c.amount);
        emit HTLCRefund(_contractId);
        return true;
    }

    function getContract(bytes32 _contractId)
        public
        view
        returns (
            address sender,
            address receiver,
            uint256 amount,
            bytes32 hashlock,
            uint256 timelock,
            bool withdrawn,
            bool refunded,
            address token
        )
    {
        if (haveContract(_contractId) == false)
            return (address(0), address(0), 0, 0, 0, false, false, address(0));
        HTLCContract storage c = contracts[_contractId];
        return (
            c.sender,
            c.receiver,
            c.amount,
            c.hashlock,
            c.timelock,
            c.withdrawn,
            c.refunded,
            c.token
        );
    }

    function haveContract(bytes32 _contractId)
        internal
        view
        returns (bool exists)
    {
        exists = (contracts[_contractId].sender != address(0));
    }
}