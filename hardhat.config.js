require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");

if (process.env.REPORT_GAS) {
  require('hardhat-gas-reporter');
}

if (process.env.REPORT_COVERAGE) {
  require('solidity-coverage');
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
    },
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/iPtkGoOcSXwb8SuqheUJkGoVNUkgSvhA",
      accounts: [
        "0x9ff25894f957898d4dae20c61eb4215ea4fc9ed5f643afdcab7d19f7a9cb220b",
        "0xae1342e2fd209ed29f955b2ff05ca8f7781ab35f25bc831850ff52e35d3e7a80",
        "0x0b4b03cee94fbd98a818c6366fe4ce470f1d42f5bd52a84d515518f556b56eb0",
        "0xdceb5642812d61525bba488384401067453c372a0c5f42ca3b7b943fb8e1bc5e",
        "0xd074bedb0284c93a373a6128daffa9360d88d1796b3608f96edd413cadcfc8d2",
        "0xbc8961431d859fa5995a4d688c95dea2d3e4c28660a986cd22fba17669d84731",
      ],
      
    }
  },
  solidity: {
    version: '0.8.11',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  gasReporter: {
    currency: 'USD',
    token: 'ETH',
    gasPrice: 60,
    showTimeSpent: true,
  },
  plugins: ['solidity-coverage'],
  etherscan: {
    apiKey: '',
  }
};