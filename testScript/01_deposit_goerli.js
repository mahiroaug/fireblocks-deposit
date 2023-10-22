// enable dotenv
require('dotenv').config({ path: '.env.common'});
require('dotenv').config({ path: '.env.goerli'});

const fs = require('fs');
const path = require('path');
const Web3 = require("web3");
const { inspect } = require('util');
const { FireblocksSDK, PeerType, TransactionOperation, TransactionStatus, Web3ConnectionFeeLevel } = require("fireblocks-sdk");
const { FireblocksWeb3Provider, ChainId } = require("@fireblocks/fireblocks-web3-provider");

// -------------------COMMON----------------------- //
//// common environment
const DEPOSIT_CA = process.env.DEPOSIT_CONTRACT_ADDRESS;
const DEPOSIT_ABI = require('../artifacts/contracts/deposit_contract.sol/DepositContract.json').abi;
const EXPLOERE = process.env.EXPLOERE;


// -------------------LOCALHOST------------------- //
const PROVIDER = process.env.JSON_RPC_URL;
const localProvider = new Web3.providers.HttpProvider(PROVIDER);

// -------------------FIREBLOCKS------------------- //
//// fireblocks - SDK
const fb_apiSecret = fs.readFileSync(path.resolve("fireblocks_secret_SIGNER.key"), "utf8");
const fb_apiKey = process.env.FIREBLOCKS_API_KEY_SIGNER;
const fb_base_url = process.env.FIREBLOCKS_URL;
const fireblocks = new FireblocksSDK(fb_apiSecret, fb_apiKey, fb_base_url);

//// fireblocks - web3 provider - signer account
const fb_vaultId = process.env.FIREBLOCKS_VAULT_ACCOUNT_ID;
const eip1193Provider = new FireblocksWeb3Provider({
    privateKey: fb_apiSecret,
    apiKey: fb_apiKey,
    vaultAccountIds: fb_vaultId,
    chainId: ChainId.GOERLI,
});

//// fireblocks - other setting
const assetId = process.env.FIREBLOCKS_ASSET_ID


// -------------------WEB3 PROVISIONING------------------- //
// --- localhost ---
const web3 = new Web3(localProvider);
// --- fireblocks ---
//const web3 = new Web3(eip1193Provider);


// -------------------contract------------------- //
const contract = new web3.eth.Contract(DEPOSIT_ABI, DEPOSIT_CA);

// -------------------FUNCTIONS------------------- //

/////////////////////////////////////////
////// call functions ///////////////////
/////////////////////////////////////////

async function getAccountBalance(address) {
    console.log(`Account: ${address}`);

    // native Balance
    const balance = await web3.eth.getBalance(address);
    console.log(`${assetId} Balance : ${web3.utils.fromWei(balance, 'ether')} ${assetId}`);

}


/////////////////////////////////////////
////// send functions ///////////////////
/////////////////////////////////////////

const sendTx = async (_to ,_tx ,_signer,_gasLimit) => {

    // check toAddress
    toAddress = web3.utils.toChecksumAddress(_to);
    console.log(' toAddress:',toAddress);

    // gasLimit
    const setGasLimit = _gasLimit;
    console.log(' setGasLimit:', setGasLimit);

    // gasPrice
    const gasPrice = await web3.eth.getGasPrice();
    const gasPriceInGwei = await web3.utils.fromWei(gasPrice, 'gwei');
    console.log(' gasPrice:', gasPrice,'(', gasPriceInGwei,'Gwei)');

    // estimate max Transaction Fee
    const estimateMaxTxFee = setGasLimit * gasPrice;
    const estimateMaxTxFeeETH = await web3.utils.fromWei(estimateMaxTxFee.toString(), 'ether');
    console.log(`estimate MAX Tx Fee:${estimateMaxTxFee} (${estimateMaxTxFeeETH} ${assetId})`);

    const createReceipt = await web3.eth.sendTransaction({
        to: toAddress,
        from: _signer,
        data: _tx.encodeABI(),
        gas: await web3.utils.toHex(setGasLimit)
    }).once("transactionHash", (txhash) => {
        console.log(` Send transaction ...`);
        console.log(` ${EXPLOERE}${txhash}`);
    })
    console.log(` Tx successful with hash: ${createReceipt.transactionHash} in block ${createReceipt.blockNumber}`);

    return(createReceipt);
}

async function sendDeposit(req,payerAddr){
    try{
        const tx = await contract.methods.deposit(
            '0x' + req.pubkey,
            '0x' + withdrawal_credentials,
            '0x' + signature,
            '0x' + deposit_data_root
        );
        const receipt = await sendTx(DEPOSIT_CA,tx,payerAddr,150000);
        console.log("send permit");
        
    } catch(error){
        console.error('Error:', error);
    }
}

async function readDepositJson(filename){
    try {
        const rawData = fs.readFileSync(filename, 'utf8');
        const data = JSON.parse(rawData);

        // display
        console.log("PublicKey            :", data[0].pubkey);
        console.log("WithdrawalCredentials:", data[0].withdrawal_credentials);
        console.log("signature            :", data[0].signature);
        console.log("deposit_data_root    :", data[0].deposit_data_root);

        return data[0];

    } catch (error) {
        console.error("Error reading or parsing the file:", error);
    }
}



/////////////////////////////////////////
////// main /////////////////////////////
/////////////////////////////////////////

(async() => {

    
    console.log("//////////////////////////////////////");
    console.log("/////////// STEP1 LOAD JSON //////////");
    console.log("//////////////////////////////////////");
    console.log("-------- IMPLEMENT ---------");
    console.log(`deposit contract address: ${DEPOSIT_CA}, verifying: ${web3.utils.isAddress(DEPOSIT_CA)}`);

    // read deposit.json
    console.log("-------- DEPOSIT.JSON ---------");
    const filename = process.argv[2];
    if (!filename) {
        console.error("Please provide a filename as an argument.");
        process.exit(1);
    } else {
        const req = readDepositJson(filename);
    }

    /*
    console.log("========== SGINER ==========");
    const vaultAddr = await web3.eth.getAccounts();
    const signerAddr = vaultAddr[0];
    console.log('signer address: ',signerAddr);
    const tc = await web3.eth.getTransactionCount(signerAddr);
    console.log('transactionCount: ',tc);
    console.log("-------- GET VALUE ---------");
    await getAccountBalance(signerAddr);
    */

    console.log("//////////////////////////////////////");
    console.log("/////////// STEP2 DEPOSIT ////////////");
    console.log("//////////////////////////////////////");
    console.log("========== SGINER ==========");
    const signerAddr = process.env.ADDR_METAMASK;
    console.log('signer address: ',signerAddr);
    const tc = await web3.eth.getTransactionCount(signerAddr);
    console.log('transactionCount: ',tc);
    console.log("-------- GET VALUE ---------");
    await getAccountBalance(signerAddr);


})().catch(error => {
    console.log(error)
});
