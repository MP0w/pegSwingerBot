import { WFTM_ABI, WFTM_ADDRESS, BEFTM_ADDRESS } from "./abi";
import { ethers } from "hardhat";
import express from 'express'
import { Request, Response} from 'express'
import { IERC20, IERC20__factory, Swinger } from "../typechain";
import { BigNumber } from "ethers";

const app = express();
const PORT = process.env.PORT || 3000;
var heartbeat = Date()

app.get('/', async (req: Request, res: Response) => {
    const swinger = await ethers.getContractAt("Swinger", process.env.SWINGER_ADDRESS!)
    const treasury = await swinger.treasury()
    const WFTM = await ethers.getContractAt(WFTM_ABI, WFTM_ADDRESS)
    const BEFTM = await ethers.getContractAt(IERC20__factory.abi, BEFTM_ADDRESS)
    const wftmBalance = ethers.BigNumber.from(await WFTM.balanceOf(treasury))
    const beftmBalance = ethers.BigNumber.from(await BEFTM.balanceOf(treasury))
    res.send(
        "wFTM Balance " + wftmBalance.toString() + " \n " +
        "beFTM Balance " + beftmBalance.toString() + " \n " +
        "heartbeat " + heartbeat + " \n"
    )
});

app.listen(PORT, () => {
    console.log(`App is running on port ${ PORT }`)
    
    var http = require("http");
    setInterval(function() {
      http.get("http://pegswingbot.herokuapp.com");
    }, 300000);

    runLoop()
});

async function runLoop() {
    const provider = ethers.getDefaultProvider();
    const swinger = await ethers.getContractAt("Swinger", process.env.SWINGER_ADDRESS!)
    const treasury = await swinger.treasury()
    const upperbound = 1000 / Number(await swinger.upperbound()) * 1000 // contract is flipped
    const lowerbound = 1000 / Number(await swinger.lowerBound()) * 1000 // contract is flipped

    try {
        await checkSwing(swinger, treasury, Number(upperbound), Number(lowerbound))
    } catch (error) {
        console.log(error)
        await sleep(5)
        await runLoop()
    }
}

async function checkSwing(swinger: Swinger, treasury: string, upperbound: number, lowerBound: number) {
    heartbeat = Date()

    const WFTM = await ethers.getContractAt(WFTM_ABI, WFTM_ADDRESS)
    const BEFTM = await ethers.getContractAt(IERC20__factory.abi, BEFTM_ADDRESS)

    const wftmBalance = ethers.BigNumber.from(await WFTM.balanceOf(treasury))
    await swingIfNeeded(swinger, wftmBalance, true, lowerBound)

    const beftmBalance = ethers.BigNumber.from(await BEFTM.balanceOf(treasury))
    await swingIfNeeded(swinger, beftmBalance, false, upperbound)
  
    await sleep(1)
    await checkSwing(swinger, treasury, upperbound, lowerBound)
}

async function adjustedGasPrice(): Promise<BigNumber> {
    const gasPrice = await ethers.provider.getGasPrice()
    console.log("Current gas Price: " + gasPrice)

    if (gasPrice <= ethers.BigNumber.from(400000000000)) {
        return ethers.BigNumber.from(500000000000)
    } else if (gasPrice <= ethers.BigNumber.from(600000000000)) {
        return gasPrice.mul(2)
    } else if (gasPrice <= ethers.BigNumber.from(1200000000000)) {
        return gasPrice.mul(1)
    }

    return gasPrice
}

async function swingIfNeeded(swinger: Swinger, balance: BigNumber, toPegged: boolean, bound: number) {
    if (balance <= ethers.BigNumber.from(0)) {
        return
    }

    const ratio = Number(await swinger.getRatio(balance, toPegged))
    if (ratio <= bound) {
        const gasPrice = await adjustedGasPrice()
        console.log("Swap - ratio " + ratio + " bound " + bound + " toPegged " + toPegged + " gas " + gasPrice)
        await swinger.swing(toPegged, { gasPrice: gasPrice })
        await sleep(30)
    }
}

async function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}