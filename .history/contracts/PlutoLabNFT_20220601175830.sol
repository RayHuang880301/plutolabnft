// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract PlutoLabNFT is ERC1155Supply, Ownable {
    string public name;
    string public symbol;
    bool public paused;

    constructor() ERC1155("") {
        name = "Pluto Lab NFT";
        symbol = "PLUTOLABNFT";
        paused = false;
    }

    struct nft {
        uint256 maxAmount;
        uint256 preSalePrice;
        uint256 publicPrice;
        uint256 freeClaimStartTime;
        uint256 preSaleStartTime;
        uint256 publicSaleStartTime;
        uint256 freeClaimEndTime;
        uint256 preSaleEndTime;
        uint256 publicSaleEndTime;
        uint256 maxPublicMintAmountPerTx;
        string tokenURI;
        bytes32 freeClaimMerkleRoot;
        bytes32 preSaleMerkleRoot;
    }

    nft[] public nftList;

    function setNftStatus(
        uint256 _id,
        uint256 _amount,
        uint256 _preSalePrice,
        uint256 _publicPrice,
        uint256 _freeClaimStartTime,
        uint256 _preSaleStartTime,
        uint256 _publicSaleStartTime,
        uint256 _freeClaimEndTime,
        uint256 _preSaleEndTime,
        uint256 _publicSaleEndTime,
        uint256 _maxPublicMintAmountPerTx,
        string memory _uri
    ) external onlyOwner {
        nftList[_id].maxAmount = _amount;
        nftList[_id].preSalePrice = _preSalePrice;
        nftList[_id].publicPrice = _publicPrice;
        nftList[_id].freeClaimStartTime = _freeClaimStartTime;
        nftList[_id].preSaleStartTime = _preSaleStartTime;
        nftList[_id].publicSaleStartTime = _publicSaleStartTime;
        nftList[_id].freeClaimEndTime = _freeClaimEndTime;
        nftList[_id].preSaleEndTime = _preSaleEndTime;
        nftList[_id].publicSaleEndTime = _publicSaleEndTime;
        nftList[_id].maxPublicMintAmountPerTx = _maxPublicMintAmountPerTx;
        nftList[_id].tokenURI = _uri;
    }

    function checkNftStatus(uint256 _id) public view returns (nft memory) {
        return nftList[_id];
    }

    function checkFreeClaimAllowlist(
        uint256 _id,
        address addr,
        uint256 _amount,
        bytes32[] calldata proof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(addr, _amount));
        return
            MerkleProof.verify(proof, nftList[_id].freeClaimMerkleRoot, leaf);
    }

    function checkPreSaleAllowlist(
        uint256 _id,
        address addr,
        uint256 _amount,
        bytes32[] calldata proof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(addr, _amount));
        return MerkleProof.verify(proof, nftList[_id].preSaleMerkleRoot, leaf);
    }

    // function setPresaleActive(uint256 _id) external onlyOwner {
    //     nftList[_id].presaleState = true;
    // }

    // function setPublicSaleActive(uint256 _id) external onlyOwner {
    //     nftList[_id].publicSaleState = true;
    // }

    function setMerkleRoot(
        uint256 _id,
        bytes32 _freeClaimMerkleRoot,
        bytes32 _preSaleMerkleRoot
    ) external onlyOwner {
        nftList[_id].freeClaimMerkleRoot = _freeClaimMerkleRoot;
        nftList[_id].preSaleMerkleRoot = _preSaleMerkleRoot;
    }

    function devMint(uint256 _id, uint256 _amount) public onlyOwner {
        require(!paused, "the contract is paused");
        require(_amount > 0, "need to mint at least 1 NFT");
        require(
            totalSupply(_id) + _amount <= nftList[_id].maxAmount,
            "exceeds max supply"
        );
        _mint(owner(), _id, _amount, "");
    }

    function freeClaim(
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes32[] calldata proof
    ) public {
        require(!paused, "the contract is paused");
        require(
            checkFreeClaimAllowlist(_id, _to, _amount, proof),
            "not in free claim list"
        );
        require(_amount > 0, "need to mint at least 1 NFT");
        require(tx.origin == msg.sender, "EOA only"); // to check
        require(
            totalSupply(_id) + _amount <= nftList[_id].maxAmount,
            "exceeds max supply"
        );
        require(
            block.timestamp >= nftList[_id].freeClaimStartTime &&
                block.timestamp <= nftList[_id].freeClaimEndTime,
            "free claim haven't started yet"
        );
        _mint(_to, _id, _amount, "");
    }

    function preSaleMint(
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes32[] calldata proof
    ) public payable {
        require(!paused, "the contract is paused");
        require(
            checkPreSaleAllowlist(_id, _to, _amount, proof),
            "not in whitelist"
        );
        require(_amount > 0, "need to mint at least 1 NFT");
        require(tx.origin == msg.sender, "EOA only"); // to check
        uint256 cost = nftList[_id].preSalePrice * _amount;
        require(msg.value == cost, "incorrect payment");
        require(
            totalSupply(_id) + _amount <= nftList[_id].maxAmount,
            "exceeds max supply"
        );
        require(
            block.timestamp >= nftList[_id].preSaleStartTime &&
                block.timestamp <= nftList[_id].preSaleEndTime,
            "pre-sale haven't started yet"
        );
        _mint(_to, _id, _amount, "");
    }

    function publicMint(
        address _to,
        uint256 _id,
        uint256 _amount
    ) public payable {
        require(!paused, "the contract is paused");
        require(_amount > 0, "need to mint at least 1 NFT");
        require(tx.origin == msg.sender, "EOA only"); // to check
        uint256 cost = nftList[_id].publicPrice * _amount;
        require(msg.value == cost, "incorrect payment");
        require(
            totalSupply(_id) + _amount <= nftList[_id].maxAmount,
            "exceeds max supply"
        );
        require(
            _amount <= nftList[_id].maxPublicMintAmountPerTx,
            "exceeds max amount per tx"
        );
        require(
            block.timestamp >= nftList[_id].publicSaleStartTime &&
                block.timestamp <= nftList[_id].publicSaleEndTime,
            "public sale haven't started yet"
        );
        _mint(_to, _id, _amount, "");
    }

    // function mintBatch(address _to, uint[] memory _ids, uint[] memory _amounts) payable public {
    //   _mintBatch(_to, _ids, _amounts, "");
    // }

    function burn(uint256 _id, uint256 _amount) external {
        _burn(msg.sender, _id, _amount);
    }

    // function burnBatch(uint[] memory _ids, uint[] memory _amounts) external {
    //   _burnBatch(msg.sender, _ids, _amounts);
    // }

    function burnForMint(
        address _from,
        uint256[] memory _burnIds,
        uint256[] memory _burnAmounts,
        uint256[] memory _mintIds,
        uint256[] memory _mintAmounts
    ) external onlyOwner {
        _burnBatch(_from, _burnIds, _burnAmounts);
        _mintBatch(_from, _mintIds, _mintAmounts, "");
    }

    function setURI(uint256 _id, string memory _uri) external onlyOwner {
        nftList[_id].tokenURI = _uri;
        emit URI(_uri, _id);
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return nftList[_id].tokenURI;
    }

    function withdraw(uint256 _amount) public onlyOwner {
        require(_amount <= address(this).balance, "not enough balance");
        (bool success, ) = payable(owner()).call{value: _amount}("");
        require(success, "failed to withdraw");
    }
}
