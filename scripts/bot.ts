import { WFTM_ABI, WFTM_ADDRESS, ERC20_ABI, BEFTM_ADDRESS } from "./abi";
import { ethers } from "hardhat";
import express from 'express'
import { Request, Response} from 'express'
import { Swinger } from "../typechain";
import { BigNumber } from "ethers";

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req: Request, res: Response) => {
    const swinger = await ethers.getContractAt("Swinger", process.env.SWINGER_ADDRESS!)
    const treasury = await swinger.treasury()
    const WFTM = await ethers.getContractAt(WFTM_ABI, WFTM_ADDRESS)
    const BEFTM = await ethers.getContractAt(ERC20_ABI, BEFTM_ADDRESS)
    const wftmBalance = ethers.BigNumber.from(await WFTM.balanceOf(treasury))
    const beftmBalance = ethers.BigNumber.from(await BEFTM.balanceOf(treasury))
    res.send("wFTM Balance " + wftmBalance.toString() + " \n " + "beFTM Balance " + beftmBalance.toString() + " \n ")
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
    const WFTM = await ethers.getContractAt(WFTM_ABI, WFTM_ADDRESS)
    const BEFTM = await ethers.getContractAt(ERC20_ABI, BEFTM_ADDRESS)

    const wftmBalance = ethers.BigNumber.from(await WFTM.balanceOf(treasury))
    console.log("WFTM balance " + wftmBalance.toString())
    await swingIfNeeded(swinger, wftmBalance, true, lowerBound)

    const beftmBalance = ethers.BigNumber.from(await BEFTM.balanceOf(treasury))
    console.log("beFTM balance " + beftmBalance.toString())
    await swingIfNeeded(swinger, beftmBalance, false, upperbound)
  
    await sleep(1)
    await checkSwing(swinger, treasury, upperbound, lowerBound)
}

async function swingIfNeeded(swinger: Swinger, balance: BigNumber, toPegged: boolean, bound: number) {
    if (balance <= ethers.BigNumber.from(0)) {
        return
    }

    const ratio = Number(await swinger.getRatio(balance, toPegged))
    console.log("ratio " + ratio + " bound " + bound + " toP " + toPegged)
    if (ratio <= bound) {
        console.log("Swap to pegged with ratio " + ratio)
        await swinger.swing(toPegged)
        await sleep(30)
    }
}

async function sleep(s: number) {
    console.log("sleep " + s)
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}