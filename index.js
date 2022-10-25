const Web3 = require('web3');
const fs = require('fs')

var WSWEB3 = 'ws://localhost:8546'  // WebSocket endpoint for the RPC server

var web3 = new Web3(Web3.givenProvider || WSWEB3);

web3.extend({
    property: 'bor',
    methods: [{
        name: 'getAuthor',
        call: 'bor_getAuthor',
        params: 1
    }]
})

const timer = ms => new Promise(res => setTimeout(res, ms))

async function getMiner(blockNum) {
    var hexBlockNum = '0x' + blockNum.toString(16)
    let miner = await web3.bor.getAuthor(hexBlockNum)
    return miner
}

async function main() {

    let now = Math.floor(new Date().getTime() / 1000)

    await fs.appendFile(`./output/outFull-${now}.csv`, `timestamp, blockNumber, Validator, TxLength`, function (err) {
        if (err) throw err;
        console.log('Created output file : ' + `./output/outFull-${now}.csv`);
    });

    await timer(1000)

    let endblock = await web3.eth.getBlockNumber()
    let startBlock = endblock - 50000;
    var totalBlocks = new Map();
    var emptyBlocks = new Map();

    for (let i = startBlock; i < endblock;) {
        if (i % 100 === 0) {
            console.log("Block: " + i);
        }

        try {
            var blockObject = await web3.eth.getBlock(i);
            var allTransactions = blockObject.transactions;
            var miner = await getMiner(i)

            if (totalBlocks.has(miner)) {
                totalBlocks.set(miner, parseInt(totalBlocks.get(miner)) + 1)
                if (allTransactions.length === 0) {
                    emptyBlocks.set(miner, parseInt(emptyBlocks.get(miner)) + 1)
                }
            } else {
                totalBlocks.set(miner, 1)
                emptyBlocks.set(miner, 0)
                if (allTransactions.length === 0) {
                    emptyBlocks.set(miner, 1)
                }
            }

            await fs.appendFile(`./output/outFull-${now}.csv`, `\n${blockObject.timestamp}, ${i}, ${miner}, ${allTransactions.length}`, function (err) {
                if (err) throw err;
            });

            i++;
        } catch (error) {
            console.log("Warn: " + error)
            console.log("Retrying block: " + i)
            timer(1000)
        }   

    }


    await fs.appendFile(`./output/out-${now}.csv`, `validator, total-blocks, zero-blocks`, function (err) {
        if (err) throw err;
        console.log('Created output file : ' + `./output/out-${now}.csv`);
    });

    await timer(1000)


    for (var [key, value] of totalBlocks.entries()) {
        await fs.appendFile(`./output/out-${now}.csv`, `\n${key}, ${value}, ${emptyBlocks.get(key)}`, function (err) {
            if (err) throw err;

        });
    }

    await timer(3000)

    process.exit(0)

}

main()
