const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');
const keccak256 = ethers.utils.solidityKeccak256;
const { getMerkle, getProof } = require('./merkle.js');

const deployContract = async function (contractName, constructorArgs) {
  let factory;
  try {
    factory = await ethers.getContractFactory(contractName);
  } catch (e) {
    factory = await ethers.getContractFactory(contractName + 'UpgradeableWithInit');
  }
  let contract = await factory.deploy(...(constructorArgs || []));
  await contract.deployed();
  return contract;
};

const getBlockTimestamp = async function () {
  return parseInt((await ethers.provider.getBlock('latest'))['timestamp']);
};

const mineBlockTimestamp = async function (timestamp) {
  await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp]);
  await ethers.provider.send('evm_mine');
};

const offsettedIndex = function (startTokenId, arr) {
  // return one item if arr length is 1
  if (arr.length === 1) {
    return BigNumber.from(startTokenId + arr[0]);
  }
  return arr.map((num) => BigNumber.from(startTokenId + num));
};

const getAllowedItemHash = function (address, amount) {
  const bytes = ethers.utils.solidityPack(["address", "uint256"], [address, BigNumber.from(amount)]);

  return keccak256(['bytes'], [bytes]);
}

const getAllowedItemProof = function (tree, address, amount) {
  const hash =  getAllowedItemHash(address, amount);
  return getProof(tree, hash);
}

const delay = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { deployContract, getBlockTimestamp, mineBlockTimestamp, offsettedIndex, getAllowedItemProof, getAllowedItemHash, delay };