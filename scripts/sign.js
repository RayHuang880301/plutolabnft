const { getMerkle, getProof } = require('../test/merkle.js');
const { deployContract, getBlockTimestamp, mineBlockTimestamp, offsettedIndex, getAllowedItemProof, getAllowedItemHash, delay } = require('../test/helpers.js');
const whitelist = require('../test/whitelist.json');

const DefaultAllowedListLeafs = whitelist.map(item => getAllowedItemHash(item[0], item[1]));

const tree = getMerkle(DefaultAllowedListLeafs);
const root = `0x${tree.getRoot().toString('hex')}`;
const leaf = getAllowedItemHash("0x98B2F5AbB95ef8Cca19f380916Db61c7615Dd62F", 10);
const proof = tree.getProof(leaf);
const proof2 = getAllowedItemProof(tree, "0x98B2F5AbB95ef8Cca19f380916Db61c7615Dd62F", 10);
console.log(root, leaf, proof, proof2)