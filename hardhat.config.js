require('dotenv').config({ path: '.env.common'});
//require('dotenv').config({ path: '.env.goerli'});
require('dotenv').config({ path: '.env.holesky'});

require("@nomicfoundation/hardhat-toolbox");

const JSON_RPC_URL = process.env.JSON_RPC_URL;
const PRIVATE_KEY = process.env.ADDR_METAMASK_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.9",
  defaultNetwork: "goerli",
  networks: {
    goerli: {
      url: `${JSON_RPC_URL}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    holesky: {
      url: `${JSON_RPC_URL}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
  }
};