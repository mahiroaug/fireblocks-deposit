/*
 execute deposit-contract via web3provider(localhost) with direct private_key

  NOT USE FIREBLOCKS

  usage:   node testScript/02_deposit_holesky.js <deposit.json>
  example: node testScript/02_deposit_holesky.js sampleData/deposit_data-1697983601.json 
 
  */


// enable dotenv
require('dotenv').config({ path: '.env.common'});
require('dotenv').config({ path: '.env.holesky'});

const askUserQuestion = require('../util/userPrompt');
const fs = require('fs');
const path = require('path');
const Web3 = require("web3");
const { inspect } = require('util');
const { FireblocksSDK, PeerType, TransactionOperation, TransactionStatus, Web3ConnectionFeeLevel } = require("fireblocks-sdk");
const { FireblocksWeb3Provider, ChainId } = require("@fireblocks/fireblocks-web3-provider");
const { Agent } = require('http');

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

// -------------------FUNCTIONS------------------- //

/////////////////////////////////////////
////// util /////////////////////////////
/////////////////////////////////////////

async function readDepositJson(filename){
    try {
        const rawData = fs.readFileSync(filename, 'utf8');
        const data = JSON.parse(rawData);

        /*
        // display
        console.log("PublicKey            :", data[0].pubkey);
        console.log("WithdrawalCredentials:", data[0].withdrawal_credentials);
        console.log("signature            :", data[0].signature);
        console.log("deposit_data_root    :", data[0].deposit_data_root);
        */
        return data[0];

    } catch (error) {
        console.error("Error reading or parsing the file:", error);
    }
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
 sendDeposit
  req   : json object
  payer : web3 object
*/
async function sendDeposit(req,payer,custom_amount){
    try{
        const tx = await contract.methods.deposit(
            '0x' + req.pubkey,
            '0x' + req.withdrawal_credentials,
            '0x' + req.signature,
            '0x' + req.deposit_data_root
        );

        let value;
        if(custom_amount == undefined){
            value = web3.utils.toWei(req.amount.toString(),'gwei');
        } else {
            value = web3.utils.toWei(custom_amount.toString(), 'ether');
        }
        console.log("deposit_value: ",value);

        if (!await askUserQuestion('(final check) continue deposit?')) {
            console.log("exit");
            process.exit(0);
        }
    
        console.log("/////////// EXECUTE DEPOSIT TRANSACTION  //////////");
        const receipt = await sendTx(DEPOSIT_CA,tx,payer,150000,value);
        console.log("COMPLETE Deposit!!");
        
    } catch(error){
        console.error('Error:', error);
    }
}



/////////////////////////////////////////
////// main /////////////////////////////
/////////////////////////////////////////

(async() => {
    const args = process.argv;
    if(args.length>4){
        console.log("too many arguments");
        process.exit(1);
    }
    

    //-----------read deposit.json--------------------------//
    console.log("//////////////////////////////////////");
    console.log("/////////// STEP1 LOAD JSON //////////");
    console.log("//////////////////////////////////////");
    console.log("-------- IMPLEMENT ---------");

    const deposit_ca_verify = web3.utils.isAddress(DEPOSIT_CA);
    console.log(`deposit contract address: ${DEPOSIT_CA} verifying: ${deposit_ca_verify}`)
    if(!deposit_ca_verify){
        process.exit(1);
    }
    if (!await askUserQuestion('(1st check) continue deposit?')) {
        console.log("exit");
        process.exit(0);
    }

    let req;
    console.log("");
    console.log("first argument: ",args[2]);
    console.log("-------- DEPOSIT.JSON ---------");
    const filename = args[2];
    if (!filename) {
        console.error("Please provide a filename as an argument.");
        process.exit(1);
    } else {
        req = await readDepositJson(filename);
    }
    console.log("JSON[0]: ",req);
    
    console.log("-------- DEPOSIT PARAMETER ---------");
    console.log(">>>>>> deposit_parameter")
    console.log("pubkey                 :", req.pubkey);
    console.log("withdrawal_credentials :", req.withdrawal_credentials);
    console.log("signature              :", req.signature);
    console.log("deposit_data_root      :", req.deposit_data_root);
    console.log(">>>>>> deposit_value [wei]")
    console.log("value                  :", web3.utils.toWei(req.amount.toString(),'gwei'))

    if (!await askUserQuestion('(2nd check) continue deposit?')) {
        console.log("exit");
        process.exit(0);
    }

    //-----------custom value for deposit amount------------//
    let custom_amount;
    if(args.length==4) {
        console.log("//////////////////////////////////////");
        console.log("/////////// STEP1b CUSTOM VALUE //////");
        console.log("//////////////////////////////////////");

        console.log("second argument: ",args[3]);
        custom_amount = Number(args[3]);
        if(Number.isInteger(custom_amount) && custom_amount >=1 && custom_amount <=32) {
            console.log(`cusom value = ${custom_amount} ETH`);
        } else {
            console.log("invalid amount(out of range at integer [1~32])");
            process.exit(1);
        }
    } else {
        console.log(`value = 32 ETH`);
    }

    if (!await askUserQuestion('(3rd check) continue deposit?')) {
        console.log("exit");
        process.exit(0);
    }


    //-----------deposit------------//
    console.log("//////////////////////////////////////");
    console.log("/////////// STEP2 DEPOSIT ////////////");
    console.log("//////////////////////////////////////");

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
    if(custom_amount == undefined) {
        await sendDeposit(req,signer);
    } else {
        await sendDeposit(req,signer,custom_amount);

    }

    return;



})().catch(error => {
    console.log(error)
});
