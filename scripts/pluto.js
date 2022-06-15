// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { getMerkle, getProof } = require('../test/merkle.js');
const { deployContract, getBlockTimestamp, mineBlockTimestamp, offsettedIndex, getAllowedItemProof, getAllowedItemHash, delay } = require('../test/helpers.js');
const { ethers } = require("hardhat");
const { BigNumber } = require('ethers');

const whitelist = require('../test/whitelist.json');

const DefaultAllowedListLeafs = whitelist.map(item => getAllowedItemHash(item[0], item[1]));
const ADDRESS = '0x20Da6f39A61cd76d0A4bD9af624800B9053414CB';
async function main() {
  const accounts = await hre.ethers.getSigners();
  console.log(accounts.slice(0,5).map(v => v.address));
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Pluto = await hre.ethers.getContractFactory("PlutoLabNFT");
  // const Contract = await Pluto.deploy("Pluto Lab NFT", "PLUTOLABNFT");
  const Contract = await hre.ethers.getContractAt('PlutoLabNFT', ADDRESS);

  await Contract.deployed();
  console.log("Contract deployed to:", Contract.address);

  const tree = getMerkle(DefaultAllowedListLeafs);
  const root = `0x${tree.getRoot().toString('hex')}`;
  const leaf = getAllowedItemHash(accounts[0].address, 10);
  const proof = tree.getProof(leaf);
  const proof2 = getAllowedItemProof(tree, accounts[0].address, 10);
  console.log(accounts[0].address, leaf, proof, proof2);

  const id = BigNumber.from(1);
  const nftItem = {
    maxAmount: BigNumber.from(100),
    preSalePrice: ethers.utils.parseEther('0.0001'),
    publicPrice: ethers.utils.parseEther('0.001'),
    freeClaimStartTime: await getBlockTimestamp(),
    freeClaimEndTime: await getBlockTimestamp() + 60 * 60 * 24 * 3,
    preSaleStartTime: await getBlockTimestamp(),
    preSaleEndTime: await getBlockTimestamp() + 60 * 60 * 24 * 3,
    publicSaleStartTime: await getBlockTimestamp(),
    publicSaleEndTime: await getBlockTimestamp() + 60 * 60 * 24 * 3,
    maxPublicMintAmountPerTx: BigNumber.from(50),
    maxPublicMintAmountPerAddress: BigNumber.from(100),
    freeClaimMerkleRoot: root,
    preSaleMerkleRoot: root,
    tokenURI: '',
  }
  const receiver = accounts[0].address;
  const feeNumerator = BigNumber.from(1000);

  await Contract.setNftStatus(
    id,
    nftItem,
    receiver,
    feeNumerator
  );

  await Contract.devMint(id, 1);
  
  await Contract.preSaleMint(accounts[0].address, 1, 1, 10, proof2, {
    value: ethers.utils.parseEther('0.0001'),
  });

  


  
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
