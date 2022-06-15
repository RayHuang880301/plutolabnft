const {
  MerkleTree
} = require('merkletreejs');
const keccak256 = require('keccak256');


// const whiteList = json.whitelist;
// const whiteListMerkleTree = getMerkle(whiteList)
// const root = whiteListMerkleTree.getRoot();

function getMerkle(leafs) {
  // const leafs = whiteList.map(addr => keccak256(addr));
  return new MerkleTree(leafs, keccak256, {
    sortPairs: true
  });
};

function getProof(tree, leaf) {
  return tree.getProof(leaf).map(x => `0x${x.data.toString('hex')}`);
}


function getMerkleRoot(tree) {
  const rootHash = tree.getRoot().toString('hex');

  return rootHash;
};

// function treeVerify(claimAddress) {
//   const leaf = keccak256(claimAddress);
//   const proof = getProof(whiteListMerkleTree, claimAddress)
//   const root = whiteListMerkleTree.getRoot().toString('hex');
//   return whiteListMerkleTree.verify(proof, leaf, root);
// }


module.exports = {
  getMerkle,
  getProof,
}