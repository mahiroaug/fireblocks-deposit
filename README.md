# environment


- `.env.common`

```
ADDR_METAMASK=0x
ADDR_METAMASK_PRIVATE_KEY=


# fireblock
FIREBLOCKS_API_KEY_SIGNER=
FIREBLOCKS_URL=https://api.fireblocks.io
FIREBLOCKS_VAULT_ACCOUNT_ID=
```


- `.env.holesky`

```
JSON_RPC_URL=http://<YOUR_RPC>:8545
EXPLOERE=https://holesky.etherscan.io/tx/
DEPOSIT_CONTRACT_ADDRESS=0x4242424242424242424242424242424242424242

FIREBLOCKS_ASSET_ID=ETH_holesky
```


- `.env.goerli`

```
JSON_RPC_URL=http://<YOUR_RPC>:8545
EXPLOERE=https://goerli.etherscan.io/tx/
DEPOSIT_CONTRACT_ADDRESS=0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b

FIREBLOCKS_ASSET_ID=ETH_TEST3
```


- deployment `fireblocks_secret_SIGNER.key`


# 1. setup

- compile deposit-contract

```
npx hardhat compile
```

- create deposit.json from staking-deposit.cli


# 2. execute

- case1: direct deposit

```
node testScript/02_deposit_holesky.js sampleData/deposit_data-xxxxxxxxxxx.json
```