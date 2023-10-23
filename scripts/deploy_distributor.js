require('dotenv').config({ path: '.env.common'});
//require('dotenv').config({ path: '.env.goerli'});
require('dotenv').config({ path: '.env.holesky'});

const hre = require("hardhat");

async function main() {
  _depositContract = process.env.DEPOSIT_CONTRACT_ADDRESS;
  console.log("deposit contract address:", _depositContract);
  
  const factory = await hre.ethers.getContractFactory("BatchDeposit");
  const contract = await factory.deploy(_depositContract);
  await contract.waitForDeployment();
  console.log("contract deployed to:", contract.target);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});