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
DISTRIBUTOR_CONTRACT_ADDRESS=0x1CE901b5531a5b28a3011c120847D9fBF2E33A12

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

```bash
npx hardhat compile
```

- create deposit.json from staking-deposit.cli


```bash
./deposit new-mnemonic --num_validators 3 --chain holesky --execution_address <YOUR_RECEIPIENT_ADDRESS>
```





# 2. execute

## ---- Holesky with local node(geth) -----

- case1: direct deposit

```bash
node testScript/02_deposit_holesky.js sampleData/deposit_data-xxxxxxxxxxx.json
```

- case1b: direct deposit (custom amount for deposit)

```bash
node testScript/02_deposit_holesky.js sampleData/deposit_data-xxxxxxxxxxx.json <1~32>
```

`note that the amount except 32 is reverted from deposit_contract`



- case2: deposit via distributor(batch router) for multiple-deposits at once

```bash
node testScript/03_deposit_holesky_distributor.js sampleData/deposit_data-xxxxx.json 
```