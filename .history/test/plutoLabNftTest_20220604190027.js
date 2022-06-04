const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PlutoLabNFT", function () {
  it("Should return the new greeting once it's changed", async function () {
    const PlutoLabNFT = await ethers.getContractFactory("PlutoLabNFT");
    const plutoLabNFT = await PlutoLabNFT.deploy("");
    await plutoLabNFT.deployed();

    const setName = await plutoLabNFT.name();

    // wait until the transaction is mined
    await setName.wait();

    expect(await plutoLabNFT.name()).to.equal("Pluto Lab NFT");
  });
});
