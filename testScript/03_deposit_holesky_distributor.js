/*
 execute deposit-contract via web3provider(localhost) with direct private_key for multiple-deposits

  NOT USE FIREBLOCKS

  usage:   node testScript/03_deposit_holesky_distributor.js <deposit.json>
  example: node testScript/03_deposit_holesky_distributor.js sampleData/deposit_data-1698056498.json
 
  */


// enable dotenv
require('dotenv').config({ path: '.env.common'});
require('dotenv').config({ path: '.env.holesky'});

const fs = require('fs');
const path = require('path');
const Web3 = require("web3");
const { inspect } = require('util');
const { FireblocksSDK, PeerType, TransactionOperation, TransactionStatus, Web3ConnectionFeeLevel } = require("fireblocks-sdk");
const { FireblocksWeb3Provider, ChainId } = require("@fireblocks/fireblocks-web3-provider");
const { verify } = require('crypto');

// -------------------COMMON----------------------- //
//// common environment
const DEPOSIT_CA = process.env.DEPOSIT_CONTRACT_ADDRESS;
const DEPOSIT_ABI = require('../artifacts/contracts/deposit_contract.sol/DepositContract.json').abi;
const EXPLOERE = process.env.EXPLOERE;
const DISTRIBUTOR_CA = process.env.DISTRIBUTOR_CONTRACT_ADDRESS;
const DISTRIBUTOR_ABI = require('../artifacts/contracts/distributor.sol/BatchDeposit.json').abi;


// -------------------LOCALHOST------------------- //
const PROVIDER = process.env.JSON_RPC_URL;
const localProvider = new Web3.providers.HttpProvider(PROVIDER);

// -------------------FIREBLOCKS------------------- //
//// fireblocks - SDK
const fb_apiSecret = fs.readFileSync(path.resolve("fireblocks_secret_SIGNER.key"), "utf8");
const fb_apiKey = process.env.FIREBLOCKS_API_KEY_SIGNER;
const fb_base_url = process.env.FIREBLOCKS_URL;
const fireblocks = new FireblocksSDK(fb_apiSecret, fb_apiKey, fb_base_url);

/*
//// fireblocks - web3 provider - signer account
const fb_vaultId = process.env.FIREBLOCKS_VAULT_ACCOUNT_ID;
const eip1193Provider = new FireblocksWeb3Provider({
    privateKey: fb_apiSecret,
    apiKey: fb_apiKey,
    vaultAccountIds: fb_vaultId,
    chainId: 17000,
});
*/

//// fireblocks - other setting
const assetId = process.env.FIREBLOCKS_ASSET_ID;

// -------------------WEB3 PROVISIONING------------------- //
// --- localhost ---
const web3 = new Web3(localProvider);
// --- fireblocks ---
//const web3 = new Web3(eip1193Provider);


// -------------------contract------------------- //
const contract = new web3.eth.Contract(DEPOSIT_ABI, DEPOSIT_CA);
const distributor = new web3.eth.Contract(DISTRIBUTOR_ABI, DISTRIBUTOR_CA);

// -------------------FUNCTIONS------------------- //

/////////////////////////////////////////
////// util /////////////////////////////
/////////////////////////////////////////

async function readDepositJson(filename){
    try {
        const rawData = fs.readFileSync(filename, 'utf8');
        const data = JSON.parse(rawData);

        //console.log("data: ",data);

        let seriesData = "";
        data.forEach((item,index) => {
            console.log(`>>>>>> deposit_parameter [${index}]`)
            console.log("pubkey                 : ",item.pubkey);
            console.log("withdrawal_credentials : ",item.withdrawal_credentials);
            console.log("signature              : ",item.signature);
            console.log("deposit_data_root      : ",item.deposit_data_root);

            line = item.pubkey + item.withdrawal_credentials + item.signature + item.deposit_data_root;
            console.log("");

            if(line.length != 416){
                console.error("Error reading or parsing the file:", error);
                process.exit(1);
            }
            console.log(`oneLiner.length=${line.length} (expected: 416) verified!`);
            console.log("");
            seriesData += line;
        })

        console.log(`>>>>>> deposit_parameter series`)
        console.log("seriesData: ",seriesData);
        console.log("");

        count = seriesData.length / 416;
        reminder = seriesData.length % 416;
        verifyLength = 416 * count;
        if(reminder != 0){
            console.error("Error reading or parsing the file:", error);
            process.exit(1);
        }
        console.log(`seriesData.length=${seriesData.length} (expected: 416 * ${count} = ${verifyLength}) verified!`);
        console.log("");

        return {
            seriesData:seriesData,
            count:count
        };

    } catch (error) {
        console.error("Error reading or parsing the file:", error);
    }
}


async function sleepForSeconds(amount) {
    console.log(`Sleeping for ${amount} seconds...`);
    await new Promise(r => setTimeout(r, amount * 1000)); // milliseconds
    console.log(`${amount} seconds have passed!`);
}


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

/*
 sendTx
  _to       : destination address
  _tx       : transaction data   
  _signer   : web3 object
  _gasLimit : gas limit [gas]
  _value    : amount [wei]
*/
const sendTx = async (_to ,_tx ,_signer,_gasLimit,_value) => {

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
        from: _signer.address,
        value: _value,
        data: _tx.encodeABI(),
        gas: await web3.utils.toHex(setGasLimit)
    },
    _signer.privateKey
    ).once("transactionHash", (txhash) => {
        console.log(` Send transaction ...`);
        console.log(` ${EXPLOERE}${txhash}`);
    })
    console.log(` Tx successful with hash: ${createReceipt.transactionHash} in block ${createReceipt.blockNumber}`);

    return(createReceipt);
}

/*
 sendSeriesDeposit
  seriesData : json object(multiple deposit data)
  payer      : web3 object
  count      : the number of multiple
*/
async function sendSeriesDeposit(paramJson,payer){
    try{
        // calc deadline
        const now = new Date();
        now.setDate(now.getDate() + 1);
        const deadline = Math.floor(now.getTime() / 1000);

        // payload
        const payload = '0x' + paramJson.seriesData;

        // calc value (amount of send ETH)
        const value = web3.utils.toWei("32",'ether') * paramJson.count; // 32ETH * count

        // logging
        console.log(`>>>>>> batchDeposit parameter`)
        console.log("deadline: ",deadline);
        console.log("payload: ", payload);
        console.log("value: ",value);
        console.log("");
        
        // execute
        const tx = await distributor.methods.batchDeposit(deadline,payload);
        const receipt = await sendTx(DISTRIBUTOR_CA,tx,payer,150000,value);

        console.log("send Deposit via Distributor");
    } catch(error){
        console.error('Error:', error);
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
    }
    const paramJson = await readDepositJson(filename);
    
    console.log("-------- double check ---------");
    console.log("seriesData: ",paramJson.seriesData);
    console.log("count: ",paramJson.count);


    console.log("//////////////////////////////////////");
    console.log("/////////// STEP2 DEPOSIT ////////////");
    console.log("//////////////////////////////////////");
    console.log("========== SGINER ==========");
    const signer = web3.eth.accounts.privateKeyToAccount(process.env.ADDR_METAMASK_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(signer)
    //const signerAddr = process.env.ADDR_METAMASK;
    console.log('signer address: ',signer.address);
    const tc = await web3.eth.getTransactionCount(signer.address);
    console.log('transactionCount: ',tc);
    console.log("-------- GET VALUE ---------");
    await getAccountBalance(signer.address);


    console.log("========== DEPOSIT ==========");
    await sendSeriesDeposit(paramJson,signer);
    await sleepForSeconds(20);


    console.log("-------- GET VALUE ---------");
    await getAccountBalance(signer.address);

})().catch(error => {
    console.log(error)
});
