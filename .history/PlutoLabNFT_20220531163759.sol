// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PlutoLabNFT is ERC1155, Ownable {
    
  string public name;
  string public symbol;

  constructor() ERC1155("") {
    name = "Pluto Lab NFT";
    symbol = "PLUTOLABNFT";
  }

  struct nft {
    bool presaleState;
    bool publicSaleState;
    uint maxAmount;
    uint whiteListPrice;
    uint publicPrice;
    uint preSaleTime;
    uint publicSaleTime;
    string tokenURI;
    bytes32 merkleRoot;
  }

  nft[] public nftList;

  function setNftStatus(
    uint _id, uint _amount, uint _whiteListPrice, uint _publicPrice, uint _presaleTime, uint _publicSaleTime, string memory _uri) external onlyOwner {
    nftList[_id].maxAmount = _amount;
    nftList[_id].whiteListPrice = _whiteListPrice;
    nftList[_id].publicPrice = _publicPrice;
    nftList[_id].presaleTime = _presaleTime;
    nftList[_id].publicSaleTime = _publicSaleTime;
    nftList[_id].tokenURI = _uri;
  }

  function checkNftStatus() public view {

  }

  function checkAllowlist(uint _id, address addr, bytes32[] calldata proof) public view returns (bool)
  {
    bytes32 leaf = keccak256(abi.encodePacked(addr));
    return MerkleProof.verify(proof, nftList[_id].merkleRoot, leaf);
  }

  function setPresaleActive(uint _id) external onlyOwner {
    nftList[_id].presaleState = true;
  }

    function setPublicSaleActive(uint _id) external onlyOwner {
    nftList[_id].publicSaleState = true;
  }

  function setMerkleRoot(uint _id, bytes32 _merkleRoot) external onlyOwner {
    nftList[_id].merkleRoot = _merkleRoot;
  }  
  
  function devMint(uint _id, uint256 _amount) public onlyOwner {
    require(_amount > 0, "need to mint at least 1 NFT");
    require(totalNormalMinted() + _amount <= nftList[_id].maxAmount, "exceeds max supply");
    _mint(owner(), _id, _amount, "");
  }



  function mint(address _to, uint _id, uint _amount) payable public {
    require(nftList[_id].state, "Id is not active");
    _mint(_to, _id, _amount, "");
  }

  function mintBatch(address _to, uint[] memory _ids, uint[] memory _amounts) payable public {
    _mintBatch(_to, _ids, _amounts, "");
  }

  function burn(uint _id, uint _amount) external {
    _burn(msg.sender, _id, _amount);
  }

  function burnBatch(uint[] memory _ids, uint[] memory _amounts) external {
    _burnBatch(msg.sender, _ids, _amounts);
  }

  function burnForMint(address _from, uint[] memory _burnIds, uint[] memory _burnAmounts, uint[] memory _mintIds, uint[] memory _mintAmounts) external onlyOwner {
    _burnBatch(_from, _burnIds, _burnAmounts);
    _mintBatch(_from, _mintIds, _mintAmounts, "");
  }

  function setURI(uint _id, string memory _uri) external onlyOwner {
    nftList[_id].tokenURI = _uri;
    emit URI(_uri, _id);
  }

  function uri(uint _id) public override view returns (string memory) {
    return nftList[_id].tokenURI;
  }

}
    