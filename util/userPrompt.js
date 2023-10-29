const readline = require('readline');

async function askUserQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        console.log("");
        rl.question(question + '[Y/n]: ', (answer) => {
            const shouldContinue = answer.toLowerCase() === 'y';
            rl.close();
            resolve(shouldContinue);
        });
    });
}

module.exports = askUserQuestion;