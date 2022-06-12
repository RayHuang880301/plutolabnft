// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract PlutoLabNFT is ERC1155Supply, ERC2981, Ownable, ReentrancyGuard {
    string public name;
    string public symbol;
    bool public paused;

    constructor() ERC1155("") {
        name = "Pluto Lab NFT";
        symbol = "PLUTOLABNFT";
        paused = false;
        _setDefaultRoyalty(owner(), 1000);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, ERC2981)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    struct Nft {
        uint256 maxAmount;
        uint256 preSalePrice;
        uint256 publicPrice;
        uint256 freeClaimStartTime;
        uint256 freeClaimEndTime;
        uint256 preSaleStartTime;
        uint256 preSaleEndTime;
        uint256 publicSaleStartTime;
        uint256 publicSaleEndTime;
        uint256 maxPublicMintAmountPerTx;
        uint256 maxPublicMintAmountPerAddress;
        bytes32 freeClaimMerkleRoot;
        bytes32 preSaleMerkleRoot;
        string tokenURI;
    }

    mapping(uint256 => Nft) nftList;
    mapping(uint256 => mapping(address => uint256)) freeClaimedAmount;
    mapping(uint256 => mapping(address => uint256)) preSaleMintedAmount;
    mapping(uint256 => mapping(address => uint256)) publicMintedAmount;

    function setNftStatus(
        uint256 _id,
        Nft calldata _nft,
        address _receiver,
        uint96 _feeNumerator
    ) external onlyOwner {
        nftList[_id] = _nft;
        _setTokenRoyalty(_id, _receiver, _feeNumerator);
    }

    function checkNftStatus(uint256 _id) public view returns (Nft memory) {
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
        uint256 _mintAmount,
        uint256 _maxAmount,
        bytes32[] calldata proof
    ) external nonReentrant {
        require(!paused, "the contract is paused");
        require(_mintAmount > 0, "need to mint at least 1 NFT");
        require(
            block.timestamp >= nftList[_id].freeClaimStartTime &&
                block.timestamp <= nftList[_id].freeClaimEndTime,
            "free claim is closed"
        );
        require(
            totalSupply(_id) + _mintAmount <= nftList[_id].maxAmount,
            "exceeds max supply"
        );
        require((freeClaimedAmount[_id][_to] + _mintAmount) <= _maxAmount);
        require(checkFreeClaimAllowlist(_id, _to, _maxAmount, proof), "error");

        freeClaimedAmount[_id][_to] += _mintAmount;
        _mint(_to, _id, _mintAmount, "");
    }

    function preSaleMint(
        address _to,
        uint256 _id,
        uint256 _mintAmount,
        uint256 _maxAmount,
        bytes32[] calldata proof
    ) external payable nonReentrant {
        require(!paused, "the contract is paused");
        require(_mintAmount > 0, "need to mint at least 1 NFT");
        require(
            block.timestamp >= nftList[_id].preSaleStartTime &&
                block.timestamp <= nftList[_id].preSaleEndTime,
            "pre-sale is closed"
        );
        require(
            totalSupply(_id) + _mintAmount <= nftList[_id].maxAmount,
            "exceeds max supply"
        );
        require((preSaleMintedAmount[_id][_to] + _mintAmount) <= _maxAmount);
        require(checkPreSaleAllowlist(_id, _to, _maxAmount, proof), "error");
        uint256 cost = nftList[_id].preSalePrice * _mintAmount;
        require(msg.value >= cost, "incorrect payment");

        preSaleMintedAmount[_id][_to] += _mintAmount;
        _mint(_to, _id, _mintAmount, "");
    }

    function publicMint(
        address _to,
        uint256 _id,
        uint256 _mintAmount
    ) external payable nonReentrant {
        require(!paused, "the contract is paused");
        require(_mintAmount > 0, "need to mint at least 1 NFT");
        require(
            block.timestamp >= nftList[_id].publicSaleStartTime &&
                block.timestamp <= nftList[_id].publicSaleEndTime,
            "public sale is closed"
        );
        require(
            totalSupply(_id) + _mintAmount <= nftList[_id].maxAmount,
            "exceeds max supply"
        );
        require(
            _mintAmount <= nftList[_id].maxPublicMintAmountPerTx,
            "exceeds max amount per tx"
        );
        require(
            (publicMintedAmount[_id][_to] + _mintAmount) <=
                nftList[_id].maxPublicMintAmountPerAddress,
            "exceeds max amount per address"
        );
        uint256 cost = nftList[_id].publicPrice * _mintAmount;
        require(msg.value >= cost, "incorrect payment");

        publicMintedAmount[_id][_to] += _mintAmount;
        _mint(_to, _id, _mintAmount, "");
    }

    function burn(uint256 _id, uint256 _amount) external {
        _burn(msg.sender, _id, _amount);
    }

    function setContractStatus() external onlyOwner {
        paused = !paused;
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
