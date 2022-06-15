const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter = await ethers.getContractFactory("PlutoLabNFT");
    const greeter = await Greeter.deploy();
    await greeter.deployed();

    expect(await greeter.baseTokenURI()).to.equal("123");
    expect(await greeter.preSaleStartTime()).to.equal("1")

    // const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // // wait until the transaction is mined
    // await setGreetingTx.wait();

    // expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
