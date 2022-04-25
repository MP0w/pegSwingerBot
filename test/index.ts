import { expect } from "chai";
import { ethers } from "hardhat";
import {  ERC20_ABI, WFTM_ABI, WFTM_ADDRESS, BEFTM_ADDRESS, SOLIDLY_ROUTER } from "../scripts/abi";

describe("Swinger Integration test", function () {
  it("should swing WFTM to beFTM", async function () {
    const address = new ethers.Wallet(process.env.PRIVATE_KEY!).address
    const Swinger = await ethers.getContractFactory("Swinger")
    const swinger = await Swinger.deploy(WFTM_ADDRESS, BEFTM_ADDRESS, SOLIDLY_ROUTER, true)
    const WFTM = await ethers.getContractAt(WFTM_ABI, WFTM_ADDRESS)
    const BEFTM = await ethers.getContractAt(ERC20_ABI, BEFTM_ADDRESS)
    const amountToWrap = ethers.utils.parseEther("1000")

    await WFTM.deposit({ value: amountToWrap })

    await WFTM.approve(swinger.address, ethers.utils.parseEther("100000"))

    await swinger.setLimits(1000, 900)

    await swinger.swing(true)

    expect(await WFTM.balanceOf(address)).to.equal(0)
    const beFTMBalance = await BEFTM.balanceOf(address)
    expect(Number(beFTMBalance)).to.be.greaterThan(Number(amountToWrap))

    await BEFTM.approve(swinger.address, ethers.utils.parseEther("100000"))
    await swinger.swing(false)

    const mimAmount = Number(ethers.utils.parseEther("990"))
    expect(Number(await WFTM.balanceOf(address))).to.be.greaterThan(mimAmount)
    expect(await BEFTM.balanceOf(address)).to.equal(0)
  });
});
