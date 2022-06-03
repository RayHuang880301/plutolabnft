// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract PlutoLabNFT is ERC1155Supply, Ownable {
    string public name;
    string public symbol;

    constructor() ERC1155("") {
        name = "Pluto Lab NFT";
        symbol = "PLUTOLABNFT";
    }

    struct nft {
        uint256 maxAmount;
        uint256 preSalePrice;
        uint256 publicPrice;
        uint256 preSaleTime;
        uint256 publicSaleTime;
        uint256 maxPublicMintAmountPerTx;
        string tokenURI;
        bytes32 merkleRoot;
    }

    nft[] public nftList;

    function setNftStatus(
        uint256 _id,
        uint256 _amount,
        uint256 _preSalePrice,
        uint256 _publicPrice,
        uint256 _preSaleTime,
        uint256 _publicSaleTime,
        uint256 _maxPublicMintAmountPerTx,
        string memory _uri
    ) external onlyOwner {
        nftList[_id].maxAmount = _amount;
        nftList[_id].preSalePrice = _preSalePrice;
        nftList[_id].publicPrice = _publicPrice;
        nftList[_id].preSaleTime = _preSaleTime;
        nftList[_id].publicSaleTime = _publicSaleTime;
        nftList[_id].maxPublicMintAmountPerTx = _maxPublicMintAmountPerTx;
        nftList[_id].tokenURI = _uri;
    }

    function checkNftStatus() public view {}

    function checkAllowlist(
        uint256 _id,
        address addr,
        uint256 _amount,
        bytes32[] calldata proof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(addr, _amount));
        return MerkleProof.verify(proof, nftList[_id].merkleRoot, leaf);
    }

    // function setPresaleActive(uint256 _id) external onlyOwner {
    //     nftList[_id].presaleState = true;
    // }

    // function setPublicSaleActive(uint256 _id) external onlyOwner {
    //     nftList[_id].publicSaleState = true;
    // }

    function setMerkleRoot(uint256 _id, bytes32 _merkleRoot)
        external
        onlyOwner
    {
        nftList[_id].merkleRoot = _merkleRoot;
    }

    function devMint(uint256 _id, uint256 _amount) public onlyOwner {
        require(_amount > 0, "need to mint at least 1 NFT");
        require(
            totalSupply(_id) + _amount <= nftList[_id].maxAmount,
            "exceeds max supply"
        );
        _mint(owner(), _id, _amount, "");
    }

    function preSaleMint(
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes32[] calldata proof
    ) public payable {
        require(checkAllowlist(_id, _to, _amount, proof), "not in whitelist");
        require(_amount > 0, "need to mint at least 1 NFT");
        require(tx.origin == msg.sender, "EOA only"); // to check
        uint256 cost = nftList[_id].preSalePrice * _amount;
        require(msg.value == cost, "incorrect payment");
        require(
            totalSupply(_id) + _amount <= nftList[_id].maxAmount,
            "exceeds max supply"
        );
        require(
            block.timestamp >= nftList[_id].preSaleTime,
            "pre-sale haven't started yet"
        );
        _mint(_to, _id, _amount, "");
    }

    function publicMint(
        address _to,
        uint256 _id,
        uint256 _amount
    ) public payable {
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
            block.timestamp >= nftList[_id].publicSaleTime,
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
