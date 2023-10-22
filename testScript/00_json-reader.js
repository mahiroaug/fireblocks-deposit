const fs = require('fs');

// コマンドライン引数からファイル名を取得
const filename = process.argv[2];

if (!filename) {
    console.error("Please provide a filename as an argument.");
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(filename, 'utf8');
    const data = JSON.parse(rawData);


    let pubkey = data[0].pubkey;
    let withdrawal_credentials = data[0].withdrawal_credentials;
    let signature = data[0].signature;
    let deposit_data_root = data[0].deposit_data_root;

    // display
    console.log("Public Key:", pubkey);
    console.log("Withdrawal Credentials:", withdrawal_credentials);
    console.log("signature:", signature);
    console.log("deposit_data_root:", deposit_data_root);



} catch (error) {
    console.error("Error reading or parsing the file:", error);
}
