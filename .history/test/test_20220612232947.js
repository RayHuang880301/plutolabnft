const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require('ethers');
const { constants } = require('@openzeppelin/test-helpers');
const json = require('./whitelist.json');
const { ZERO_ADDRESS } = constants;
const { deployContract, getBlockTimestamp, mineBlockTimestamp, offsettedIndex, getAllowedItemProof, getAllowedItemHash, delay } = require('./helpers.js');
const { getMerkle, getProof } = require('./merkle.js');
const HashZero = '0x0000000000000000000000000000000000000000000000000000000000000000';


const CONTRACT_NAME = 'PlutoLabNFT';
// const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
describe("PlutoLabNFT", function () {
  let DefaultAllowedListLeafs;
  
  // context(contractName, async() => {
    // this.accounts = await ethers.getSigners();
    // this.owner = this.accounts[0];
    beforeEach(async () => {
      this.accounts = await ethers.getSigners();
      this.owner = this.accounts[0];
      this.acc1 = this.accounts[1];
      this.acc2 = this.accounts[2];
      this.acc3 = this.accounts[3];
      this.Contract = await deployContract(CONTRACT_NAME);
      if(!DefaultAllowedListLeafs) {
        DefaultAllowedListLeafs = [
          [this.accounts[0].address, 1],
          [this.accounts[1].address, 2],
          // [this.accounts[2].address, 3],
          [this.accounts[3].address, 1000],
        ].map(item => getAllowedItemHash(item[0], item[1]));
      }
    })

    const tree0 = getMerkle(json);
        console.log(tree0)
        const root0 = `0x${tree.getRoot().toString('hex')}`;
        console.log(root0)
        const proof0 = getAllowedItemProof(tree0, "0x6e24f0fF0337edf4af9c67bFf22C402302fc94D3", BigNumber.from(1))
        console.log(proof0)

    describe("Contract information exactly", () => {
      it("Name is correct", async () => {
        expect(await this.Contract.name()).to.eq("Pluto Lab NFT");
      });
      it("Symbol is correct", async () => {
        expect(await this.Contract.symbol()).to.eq("PLUTOLABNFT");
      });
    });

    describe("Contract support interface (EIP-165)", () => {
      it('supports ERC165', async () => {
        expect(await this.Contract.supportsInterface('0x01ffc9a7')).to.eq(true);
      });

      it('supports IERC1155', async () => {
        expect(await this.Contract.supportsInterface('0xd9b67a26')).to.eq(true);
      });

      it('supports IERC2981', async () => {
        expect(await this.Contract.supportsInterface('0x2a55205a')).to.eq(true);
      });

      it('supports IERC1155MetadataURI', async () => {
        expect(await this.Contract.supportsInterface('0x0e89341c')).to.eq(true);
      });

      it('does not support random interface', async () => {
        expect(await this.Contract.supportsInterface('0x00000042')).to.eq(false);
      });
    });

    describe("Contract can set NFT status", () => {
      it('setNftStatus', async () => {
        const id = BigNumber.from(1);
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: BigNumber.from(1),
          publicPrice: BigNumber.from(1),
          freeClaimStartTime: BigNumber.from(0),
          freeClaimEndTime: BigNumber.from(0),
          preSaleStartTime: BigNumber.from(0),
          preSaleEndTime: BigNumber.from(0),
          publicSaleStartTime: BigNumber.from(0),
          publicSaleEndTime: BigNumber.from(0),
          maxPublicMintAmountPerTx: BigNumber.from(1),
          maxPublicMintAmountPerAddress: BigNumber.from(1),
          freeClaimMerkleRoot: HashZero,
          preSaleMerkleRoot: HashZero,
          tokenURI: '',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);

        await this.Contract.setNftStatus(
          id,
          nftItem,
          receiver,
          feeNumerator
        );
        const _nft = await this.Contract.nftList(id);
        Object.keys(nftItem).forEach(key => {
          expect(_nft[key].toString()).to.eq(nftItem[key].toString());
        });
      });
      
      it("setMerkleRoot", async () => {
        const id = BigNumber.from(1);
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: BigNumber.from(1),
          publicPrice: BigNumber.from(1),
          freeClaimStartTime: BigNumber.from(0),
          freeClaimEndTime: BigNumber.from(0),
          preSaleStartTime: BigNumber.from(0),
          preSaleEndTime: BigNumber.from(0),
          publicSaleStartTime: BigNumber.from(0),
          publicSaleEndTime: BigNumber.from(0),
          maxPublicMintAmountPerTx: BigNumber.from(1),
          maxPublicMintAmountPerAddress: BigNumber.from(1),
          freeClaimMerkleRoot: HashZero,
          preSaleMerkleRoot: HashZero,
          tokenURI: '',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);
        await this.Contract.setNftStatus(
          id,
          nftItem,
          receiver,
          feeNumerator
        );

        const tree = getMerkle(DefaultAllowedListLeafs);
        const root = `0x${tree.getRoot().toString('hex')}`;

        await this.Contract.setMerkleRoot(id, root, HashZero);
        const _nft1 = await this.Contract.nftList(id);
        expect(_nft1.freeClaimMerkleRoot).to.equal(root);
        expect(_nft1.preSaleMerkleRoot).to.equal(HashZero);

        await this.Contract.setMerkleRoot(id, HashZero, root);
        const _nft2 = await this.Contract.nftList(id);
        expect(_nft2.freeClaimMerkleRoot).to.equal(HashZero);
        expect(_nft2.preSaleMerkleRoot).to.equal(root);
      });

      it("checkFreeClaimAllowlist", async () => {
        const tree = getMerkle(DefaultAllowedListLeafs);
        const root = tree.getRoot();

        const id = BigNumber.from(1);
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: BigNumber.from(1),
          publicPrice: BigNumber.from(1),
          freeClaimStartTime: BigNumber.from(0),
          freeClaimEndTime: BigNumber.from(0),
          preSaleStartTime: BigNumber.from(0),
          preSaleEndTime: BigNumber.from(0),
          publicSaleStartTime: BigNumber.from(0),
          publicSaleEndTime: BigNumber.from(0),
          maxPublicMintAmountPerTx: BigNumber.from(1),
          maxPublicMintAmountPerAddress: BigNumber.from(1),
          freeClaimMerkleRoot: `0x${root.toString('hex')}`,
          preSaleMerkleRoot: HashZero,
          tokenURI: '',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);
        await this.Contract.setNftStatus(
          id,
          nftItem,
          receiver,
          feeNumerator
        );
        
        const isAllowed1 = await this.Contract.checkFreeClaimAllowlist(
          id, this.accounts[0].address, BigNumber.from(1), 
          getAllowedItemProof(tree, this.accounts[0].address, BigNumber.from(1)));
        expect(isAllowed1).to.eq(true);

        const isAllowed2 = await this.Contract.checkFreeClaimAllowlist(
          id, this.accounts[0].address, BigNumber.from(2), 
          getAllowedItemProof(tree, this.accounts[0].address, BigNumber.from(2)));
        expect(isAllowed2).to.eq(false);

        const isAllowed3 = await this.Contract.checkFreeClaimAllowlist(
          id, this.accounts[0].address, BigNumber.from(2), 
          getAllowedItemProof(tree, this.accounts[0].address, BigNumber.from(1)));
        expect(isAllowed3).to.eq(false);

        const isAllowed4 = await this.Contract.checkFreeClaimAllowlist(
          id, this.acc1.address, BigNumber.from(2), 
          getAllowedItemProof(tree, this.acc1.address, BigNumber.from(2)));
        expect(isAllowed4).to.eq(true);

        const isAllowed5 = await this.Contract.checkFreeClaimAllowlist(
          id, this.acc3.address, BigNumber.from(1000), 
          getAllowedItemProof(tree, this.acc3.address, BigNumber.from(1000)));
        expect(isAllowed5).to.eq(true);

        const isAllowed6 = await this.Contract.checkFreeClaimAllowlist(
          id, this.acc3.address, BigNumber.from(1001), 
          getAllowedItemProof(tree, this.acc3.address, BigNumber.from(1000)));
        expect(isAllowed6).to.eq(false);
      });

      it("checkPreSaleAllowlist", async () => {
        const tree = getMerkle(DefaultAllowedListLeafs);
        const root = tree.getRoot();

        const id = BigNumber.from(1);
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: BigNumber.from(1),
          publicPrice: BigNumber.from(1),
          freeClaimStartTime: BigNumber.from(0),
          freeClaimEndTime: BigNumber.from(0),
          preSaleStartTime: BigNumber.from(0),
          preSaleEndTime: BigNumber.from(0),
          publicSaleStartTime: BigNumber.from(0),
          publicSaleEndTime: BigNumber.from(0),
          maxPublicMintAmountPerTx: BigNumber.from(1),
          maxPublicMintAmountPerAddress: BigNumber.from(1),
          freeClaimMerkleRoot: HashZero,
          preSaleMerkleRoot: `0x${root.toString('hex')}`,
          tokenURI: '',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);
        await this.Contract.setNftStatus(
          id,
          nftItem,
          receiver,
          feeNumerator
        );

        const isAllowed1 = await this.Contract.checkPreSaleAllowlist(
          id, this.accounts[0].address, BigNumber.from(1), 
          getAllowedItemProof(tree, this.accounts[0].address, BigNumber.from(1)));
        expect(isAllowed1).to.eq(true);

        const isAllowed2 = await this.Contract.checkPreSaleAllowlist(
          id, this.accounts[0].address, BigNumber.from(2), 
          getAllowedItemProof(tree, this.accounts[0].address, BigNumber.from(2)));
        expect(isAllowed2).to.eq(false);

        const isAllowed3 = await this.Contract.checkPreSaleAllowlist(
          id, this.accounts[0].address, BigNumber.from(2), 
          getAllowedItemProof(tree, this.accounts[0].address, BigNumber.from(1)));
        expect(isAllowed3).to.eq(false);

        const isAllowed4 = await this.Contract.checkPreSaleAllowlist(
          id, this.acc1.address, BigNumber.from(2), 
          getAllowedItemProof(tree, this.acc1.address, BigNumber.from(2)));
        expect(isAllowed4).to.eq(true);

        const isAllowed5 = await this.Contract.checkPreSaleAllowlist(
          id, this.acc3.address, BigNumber.from(1000), 
          getAllowedItemProof(tree, this.acc3.address, BigNumber.from(1000)));
        expect(isAllowed5).to.eq(true);

        const isAllowed6 = await this.Contract.checkPreSaleAllowlist(
          id, this.acc3.address, BigNumber.from(1001), 
          getAllowedItemProof(tree, this.acc3.address, BigNumber.from(1000)));
        expect(isAllowed6).to.eq(false);
      });

      it("URI is correct", async () => {
        const id = BigNumber.from(1);
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: BigNumber.from(1),
          publicPrice: BigNumber.from(1),
          freeClaimStartTime: BigNumber.from(0),
          freeClaimEndTime: BigNumber.from(0),
          preSaleStartTime: BigNumber.from(0),
          preSaleEndTime: BigNumber.from(0),
          publicSaleStartTime: BigNumber.from(0),
          publicSaleEndTime: BigNumber.from(0),
          maxPublicMintAmountPerTx: BigNumber.from(1),
          maxPublicMintAmountPerAddress: BigNumber.from(1),
          freeClaimMerkleRoot: HashZero,
          preSaleMerkleRoot: HashZero,
          tokenURI: 'https://pluto.com/',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);

        await this.Contract.setNftStatus(
          id,
          nftItem,
          receiver,
          feeNumerator
        );
        expect(await this.Contract.uri(id)).to.eq('https://pluto.com/');

        await this.Contract.setURI(
          id,
          'https://others.com/'
        );
        expect(await this.Contract.uri(id)).to.eq('https://others.com/');

      });

      // TODO: ERC2981
    });

    describe("MINT NFT", () => {
      const id = BigNumber.from(1);
      let tree;
      let root;
      beforeEach(async () => {
        if(!tree) {
          tree = getMerkle(DefaultAllowedListLeafs);
        }
        if(!root) {
          root = `0x${tree.getRoot().toString('hex')}`;
        }
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: ethers.utils.parseEther('0.1'),
          publicPrice: ethers.utils.parseEther('1'),
          freeClaimStartTime: await getBlockTimestamp(),
          freeClaimEndTime: await getBlockTimestamp() + 3,
          preSaleStartTime: await getBlockTimestamp(),
          preSaleEndTime: await getBlockTimestamp() + 10,
          publicSaleStartTime: await getBlockTimestamp(),
          publicSaleEndTime: await getBlockTimestamp() + 10,
          maxPublicMintAmountPerTx: BigNumber.from(50),
          maxPublicMintAmountPerAddress: BigNumber.from(90),
          freeClaimMerkleRoot: root,
          preSaleMerkleRoot: root,
          tokenURI: '',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);

        await this.Contract.setNftStatus(
          id,
          nftItem,
          receiver,
          feeNumerator
        );
      })
      it('devMint: balance', async() => {
        const id = 1;
        await this.Contract.devMint(id, 1);
        expect(await this.Contract.balanceOf(this.accounts[0].address, id)).to.eq(1);
        expect(await this.Contract.totalSupply(id)).to.eq(1);

        await this.Contract.devMint(id, 9);
        expect(await this.Contract.balanceOf(this.accounts[0].address, id)).to.eq(10);
        expect(await this.Contract.totalSupply(id)).to.eq(10);
      });

      it('devMint: max total supply', async() => {
        await this.Contract.devMint(id, 100);
        expect(await this.Contract.balanceOf(this.accounts[0].address, id)).to.eq(100);
        expect(await this.Contract.totalSupply(id)).to.eq(100);

        await expect(
          this.Contract.devMint(id, 1)
        ).to.be.revertedWith('exceeds max supply');
      });

      it('freeClaim: pause', async() => {
        const acc1MaxAmount = 2;
        const acc1Addr = this.acc1.address;
        const proof = getAllowedItemProof(tree, acc1Addr, acc1MaxAmount);
        await this.Contract.freeClaim(acc1Addr, id, 1, acc1MaxAmount, proof)
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(1);

        await this.Contract.setContractPaused(true);
        await expect(
          this.Contract.freeClaim(acc1Addr, id, 1, acc1MaxAmount, proof)
        ).to.be.revertedWith('the contract is paused');
      });
      it('freeClaim: balance', async() => {
        const acc1MaxAmount = 2;
        const acc1Addr = this.acc1.address;
        const proof = getAllowedItemProof(tree, acc1Addr, acc1MaxAmount);
        await this.Contract.freeClaim(acc1Addr, id, 1, acc1MaxAmount, proof)
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(1);

      });
      it('freeClaim: max claim amount', async() => {
        const acc1MaxAmount = 2;
        const acc1Addr = this.acc1.address;
        const proof = getAllowedItemProof(tree, acc1Addr, acc1MaxAmount);
        await this.Contract.freeClaim(acc1Addr, id, 2, acc1MaxAmount, proof)
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(2);

        await expect(
          this.Contract.freeClaim(acc1Addr, id, 1, acc1MaxAmount, proof)
        ).to.be.revertedWith('exceeds max claimable amount');
      });
      it('freeClaim: timeStamp', async() => {
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: ethers.utils.parseEther('0.1'),
          publicPrice: ethers.utils.parseEther('1'),
          freeClaimStartTime: await getBlockTimestamp() + 4,
          freeClaimEndTime: await getBlockTimestamp() + 7,
          preSaleStartTime: await getBlockTimestamp(),
          preSaleEndTime: await getBlockTimestamp(),
          publicSaleStartTime: await getBlockTimestamp(),
          publicSaleEndTime: await getBlockTimestamp(),
          maxPublicMintAmountPerTx: BigNumber.from(1),
          maxPublicMintAmountPerAddress: BigNumber.from(1),
          freeClaimMerkleRoot: root,
          preSaleMerkleRoot: root,
          tokenURI: '',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);

        await this.Contract.setNftStatus(
          id,
          nftItem,
          receiver,
          feeNumerator
        );
        
        const acc1MaxAmount = 2;
        const acc1Addr = this.acc1.address;
        const proof = getAllowedItemProof(tree, acc1Addr, acc1MaxAmount);

        await expect(
          this.Contract.freeClaim(acc1Addr, id, 1, acc1MaxAmount, proof)
        ).to.be.revertedWith('free claim is closed');

        await delay(3000);
        
        await this.Contract.freeClaim(acc1Addr, id, 1, acc1MaxAmount, proof)
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(1);

        await delay(3000);
        await expect(
          this.Contract.freeClaim(acc1Addr, id, 1, acc1MaxAmount, proof)
        ).to.be.revertedWith('free claim is closed');

      });
      it('freeClaim: max total supply', async() => {
        const acc3MaxAmount = 1000;
        const acc3Addr = this.acc3.address;
        const proof = getAllowedItemProof(tree, acc3Addr, acc3MaxAmount);
        await this.Contract.connect(this.acc3).freeClaim(acc3Addr, id, 100, acc3MaxAmount, proof)
        expect(await this.Contract.balanceOf(acc3Addr, id)).to.eq(100);

        await expect(
          this.Contract.connect(this.acc3).freeClaim(acc3Addr, id, 1, acc3MaxAmount, proof)
        ).to.be.revertedWith('exceeds max supply');
      });
      it('freeClaim: allowlist', async() => {
        const acc1MaxAmount = 2;
        const acc2Addr = this.acc2.address;
        const proof = getAllowedItemProof(tree, acc2Addr, acc1MaxAmount);
        await expect(
          this.Contract.freeClaim(acc2Addr, id, 1, acc1MaxAmount, proof)
        ).to.be.revertedWith('not in allowlist');
      });

      // 

      it('preSaleMint: mint price - 1', async() => {
        const acc1MaxAmount = 2;
        const acc1Addr = this.acc1.address;
        const proof = getAllowedItemProof(tree, acc1Addr, acc1MaxAmount);
        await this.Contract.connect(this.acc1).preSaleMint(acc1Addr, id, 1, acc1MaxAmount, proof, {
          value: ethers.utils.parseEther('0.1')
        });
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(1);

        await expect(
          this.Contract.connect(this.acc1).preSaleMint(acc1Addr, id, 1, acc1MaxAmount, proof, {
            value: ethers.utils.parseEther('0.1').sub(1)
          })
        ).to.be.revertedWith('incorrect payment');

        await this.Contract.connect(this.acc1).preSaleMint(acc1Addr, id, 1, acc1MaxAmount, proof, {
          value: ethers.utils.parseEther('0.1').add(1)
        });
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(2);
      });
      it('preSaleMint: mint price - 2', async() => {
        const acc3MaxAmount = 1000;
        const acc3Addr = this.acc3.address;
        const proof = getAllowedItemProof(tree, acc3Addr, acc3MaxAmount);
        await this.Contract.connect(this.acc3).preSaleMint(acc3Addr, id, 2, acc3MaxAmount, proof, {
          value: ethers.utils.parseEther('0.1').mul(2)
        });
        expect(await this.Contract.balanceOf(acc3Addr, id)).to.eq(2);

        await expect(
          this.Contract.connect(this.acc3).preSaleMint(acc3Addr, id, 2, acc3MaxAmount, proof, {
            value: ethers.utils.parseEther('0.1').mul(2).sub(1)
          })
        ).to.be.revertedWith('incorrect payment');
      });
      it('preSaleMint: pause', async() => {
        const acc1MaxAmount = 2;
        const acc1Addr = this.acc1.address;
        const proof = getAllowedItemProof(tree, acc1Addr, acc1MaxAmount);
        await this.Contract.preSaleMint(acc1Addr, id, 1, acc1MaxAmount, proof, {
          value: ethers.utils.parseEther('0.1').mul(2)
        });
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(1);

        await this.Contract.setContractPaused(true);
        await expect(
          this.Contract.preSaleMint(acc1Addr, id, 1, acc1MaxAmount, proof)
        ).to.be.revertedWith('the contract is paused');
      });
      it('preSaleMint: timeStamp', async() => {
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: ethers.utils.parseEther('0.1'),
          publicPrice: ethers.utils.parseEther('1'),
          freeClaimStartTime: 0,
          freeClaimEndTime: 0,
          preSaleStartTime: await getBlockTimestamp() + 4,
          preSaleEndTime: await getBlockTimestamp() + 7,
          publicSaleStartTime: 0,
          publicSaleEndTime: 0,
          maxPublicMintAmountPerTx: BigNumber.from(1),
          maxPublicMintAmountPerAddress: BigNumber.from(1),
          freeClaimMerkleRoot: root,
          preSaleMerkleRoot: root,
          tokenURI: '',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);

        await this.Contract.setNftStatus(
          id,
          nftItem,
          receiver,
          feeNumerator
        );
        
        const acc1MaxAmount = 2;
        const acc1Addr = this.acc1.address;
        const proof = getAllowedItemProof(tree, acc1Addr, acc1MaxAmount);

        await expect(
          this.Contract.preSaleMint(acc1Addr, id, 1, acc1MaxAmount, proof, {
          value: ethers.utils.parseEther('0.1')
        })
        ).to.be.revertedWith('pre-sale is closed');

        await delay(3000);
        
        await this.Contract.preSaleMint(acc1Addr, id, 1, acc1MaxAmount, proof, {
          value: ethers.utils.parseEther('0.1')
        })
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(1);

        await delay(3000);
        await expect(
          this.Contract.preSaleMint(acc1Addr, id, 1, acc1MaxAmount, proof, {
            value: ethers.utils.parseEther('0.1')
          })
        ).to.be.revertedWith('pre-sale is closed');
      });
      it('preSaleMint: max total supply', async() => {
        const acc3MaxAmount = 1000;
        const acc3Addr = this.acc3.address;
        const proof = getAllowedItemProof(tree, acc3Addr, acc3MaxAmount);
        await this.Contract.connect(this.acc3).preSaleMint(acc3Addr, id, 100, acc3MaxAmount, proof, {
          value: ethers.utils.parseEther('0.1').mul(100)
        })
        expect(await this.Contract.balanceOf(acc3Addr, id)).to.eq(100);

        await expect(
          this.Contract.connect(this.acc3).preSaleMint(acc3Addr, id, 1, acc3MaxAmount, proof, {
            value: ethers.utils.parseEther('0.1').mul(1)
          })
        ).to.be.revertedWith('exceeds max supply');
      });


      it('publicMint: mint price - 1', async() => {
        const acc1Addr = this.acc1.address;
        await this.Contract.connect(this.acc1).publicMint(acc1Addr, id, 1, {
          value: ethers.utils.parseEther('1')
        });
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(1);

        await expect(
          this.Contract.connect(this.acc1).publicMint(acc1Addr, id, 1, {
            value: ethers.utils.parseEther('1').sub(1)
          })
        ).to.be.revertedWith('incorrect payment');

        await this.Contract.connect(this.acc1).publicMint(acc1Addr, id, 1, {
          value: ethers.utils.parseEther('1').add(1)
        });
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(2);
      });
      it('publicMint: mint price - 2', async() => {
        const acc3Addr = this.acc3.address;
        await this.Contract.connect(this.acc3).publicMint(acc3Addr, id, 2, {
          value: ethers.utils.parseEther('1').mul(2)
        });
        expect(await this.Contract.balanceOf(acc3Addr, id)).to.eq(2);

        await expect(
          this.Contract.connect(this.acc3).publicMint(acc3Addr, id, 2, {
            value: ethers.utils.parseEther('1').mul(2).sub(1)
          })
        ).to.be.revertedWith('incorrect payment');
      });
      it('publicMint: pause', async() => {
        const acc1Addr = this.acc1.address;
        await this.Contract.publicMint(acc1Addr, id, 1, {
          value: ethers.utils.parseEther('1').mul(1)
        });
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(1);

        await this.Contract.setContractPaused(true);
        await expect(
          this.Contract.publicMint(acc1Addr, id, 1)
        ).to.be.revertedWith('the contract is paused');
      });
      it('publicMint: timestamp', async() => {
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: ethers.utils.parseEther('0.1'),
          publicPrice: ethers.utils.parseEther('1'),
          freeClaimStartTime: 0,
          freeClaimEndTime: 0,
          preSaleStartTime: 0,
          preSaleEndTime: 0,
          publicSaleStartTime: await getBlockTimestamp() + 4,
          publicSaleEndTime: await getBlockTimestamp() + 7,
          maxPublicMintAmountPerTx: BigNumber.from(1),
          maxPublicMintAmountPerAddress: BigNumber.from(1),
          freeClaimMerkleRoot: root,
          preSaleMerkleRoot: root,
          tokenURI: '',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);

        await this.Contract.setNftStatus(
          id,
          nftItem,
          receiver,
          feeNumerator
        );
        
        const acc1Addr = this.acc1.address;

        await expect(
          this.Contract.publicMint(acc1Addr, id, 1, {
          value: ethers.utils.parseEther('1')
        })
        ).to.be.revertedWith('public sale is closed');

        await delay(3000);
        
        await this.Contract.publicMint(acc1Addr, id, 1, {
          value: ethers.utils.parseEther('1')
        })
        expect(await this.Contract.balanceOf(acc1Addr, id)).to.eq(1);

        await delay(3000);
        await expect(
          this.Contract.publicMint(acc1Addr, id, 1, {
            value: ethers.utils.parseEther('1')
          })
        ).to.be.revertedWith('public sale is closed');
      });
      it('publicMint: max total supply', async() => {
        const acc1Addr = this.acc1.address;
        await this.Contract.publicMint(acc1Addr, id, 50, {
          value: ethers.utils.parseEther('1').mul(50)
        });
        await this.Contract.publicMint(this.acc2.address, id, 50, {
          value: ethers.utils.parseEther('1').mul(50)
        });

        await expect(
          this.Contract.connect(this.acc1).publicMint(acc1Addr, id, 1, {
            value: ethers.utils.parseEther('1').mul(1)
          })
        ).to.be.revertedWith('exceeds max supply');

      });
      it('publicMint: max mint amount per tx', async() => {
        const acc1Addr = this.acc1.address;
        await expect(
          this.Contract.publicMint(acc1Addr, id, 51, {
            value: ethers.utils.parseEther('1').mul(51)
          })
        ).to.be.revertedWith('exceeds max amount per tx');
      });
      it('publicMint: max mint amount per address', async() => {
        const acc1Addr = this.acc1.address;
        await this.Contract.publicMint(acc1Addr, id, 50, {
          value: ethers.utils.parseEther('1').mul(50)
        })
        await expect(
          this.Contract.publicMint(acc1Addr, id, 41, {
            value: ethers.utils.parseEther('1').mul(41)
          })
        ).to.be.revertedWith('exceeds max amount per address');
      });

      it('burn - 1', async() => {
        await this.Contract.publicMint(this.acc1.address, id, 50, {
          value: ethers.utils.parseEther('1').mul(50)
        });
        expect(await this.Contract.balanceOf(this.acc1.address, id)).to.eq(50);

        await this.Contract.connect(this.acc1).burn(id, 1);
        expect(await this.Contract.balanceOf(this.acc1.address, id)).to.eq(49);

        await this.Contract.connect(this.acc1).burn(id, 2);
        expect(await this.Contract.balanceOf(this.acc1.address, id)).to.eq(47);
      });

      it('burn - 2', async() => {
        await expect(
          this.Contract.connect(this.acc1).burn(2, 1)
        ).to.be.revertedWith('ERC1155: burn amount exceeds totalSupply');
      });

      it('burn - 3', async() => {
        await this.Contract.connect(this.acc1).publicMint(this.acc1.address, id, 50, {
          value: ethers.utils.parseEther('1').mul(50)
        });
        await expect(
          this.Contract.connect(this.acc2).burn(id, 1)
        ).to.be.revertedWith('ERC1155: burn amount exceeds balance');
      });

      it('withdraw', async () => {
        const prov = ethers.getDefaultProvider();

        await this.Contract.connect(this.acc1).publicMint(this.acc1.address, 1, 50, {
          value: ethers.utils.parseEther('1').mul(50)
        });

        const beforeBalance = await this.owner.getBalance();
        const contractBalance =await prov.getBalance(this.Contract.address);
        const txResp = await this.Contract.withdraw(contractBalance);
        const txReceipt = await txResp.wait();
        const withdrawGasFee = BigNumber.from(txReceipt.gasUsed).mul(txReceipt.effectiveGasPrice);
        const afterBalance = await this.owner.getBalance();
        expect(afterBalance.sub(beforeBalance).add(withdrawGasFee)).to.eq(contractBalance);
      });
      
    });

    describe("onlyOwner", () => {
      it('transfer owner', async () => {
        await this.Contract.transferOwnership(this.accounts[1].address);
        expect(await this.Contract.owner()).to.eq(this.accounts[1].address);
      });
      it("setNftStatus", async () => {
        const id = BigNumber.from(1);
        const nftItem = {
          maxAmount: BigNumber.from(100),
          preSalePrice: BigNumber.from(1),
          publicPrice: BigNumber.from(1),
          freeClaimStartTime: BigNumber.from(0),
          freeClaimEndTime: BigNumber.from(0),
          preSaleStartTime: BigNumber.from(0),
          preSaleEndTime: BigNumber.from(0),
          publicSaleStartTime: BigNumber.from(0),
          publicSaleEndTime: BigNumber.from(0),
          maxPublicMintAmountPerTx: BigNumber.from(1),
          maxPublicMintAmountPerAddress: BigNumber.from(1),
          freeClaimMerkleRoot: HashZero,
          preSaleMerkleRoot: HashZero,
          tokenURI: '',
        }
        const receiver = this.accounts[0].address;
        const feeNumerator = BigNumber.from(1000);
        await expect(
          this.Contract.connect(this.accounts[1]).setNftStatus(
            id,
            nftItem,
            receiver,
            feeNumerator
          )
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
      it("setMerkleRoot", async () => {
        this.Contract.setMerkleRoot(1, HashZero, HashZero)
        await expect(
          this.Contract.connect(this.accounts[1]).setMerkleRoot(1, HashZero, HashZero)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      })
      it("devMint", async () => {
        this.Contract.devMint(1, 1)
        await expect(
          this.Contract.connect(this.accounts[1]).devMint(1, 1)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      })
      it("setURI", async () => {
        this.Contract.setURI(1, 'https://pluto.com/')
        await expect(
          this.Contract.connect(this.accounts[1]).setURI(1, 'https://pluto.com/')
        ).to.be.revertedWith('Ownable: caller is not the owner');
      })
      it("devMint", async () => {
        await expect(
          this.Contract.connect(this.accounts[1]).devMint(1, 1)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      })
      it("withdraw", async () => {
        await expect(
          this.Contract.connect(this.accounts[1]).withdraw(1)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      })
      it("setContractPaused", async () => {
        await expect(
          this.Contract.connect(this.accounts[1]).setContractPaused(true)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      })
    })
});