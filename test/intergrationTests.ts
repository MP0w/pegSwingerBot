import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { ERC20_ABI, WFTM_ABI, WFTM_ADDRESS, BEFTM_ADDRESS, SOLIDLY_ROUTER, SPIRITSWAP_ROUTER } from "../scripts/abi";
import { Adapter, Swinger } from "../typechain";

async function verifySwings(adapter: string) {
  const Swinger = await ethers.getContractFactory("Swinger")
  const swinger = await Swinger.deploy(WFTM_ADDRESS, BEFTM_ADDRESS, adapter)
  const address = await swinger.owner()
  const amountToWrap = ethers.utils.parseEther("100")
  const WFTM = await ethers.getContractAt(WFTM_ABI, WFTM_ADDRESS)
  const BEFTM = await ethers.getContractAt(ERC20_ABI, BEFTM_ADDRESS)

  await WFTM.deposit({ value: amountToWrap })
  const balance = await WFTM.balanceOf(address)
  await WFTM.approve(swinger.address, balance)
  await swinger.setLimits(1000, 900)
  // swing to beFTM
  await swinger.swing(true)

  expect(await WFTM.balanceOf(address)).to.equal(0)
  expect(await BEFTM.balanceOf(address)).to.not.equal(0)
  const beFTMBalance = await BEFTM.balanceOf(address)

  await BEFTM.approve(swinger.address, beFTMBalance)
  // swing to WFTM
  await swinger.swing(false)

  expect(await BEFTM.balanceOf(address)).to.equal(0)
  expect(await WFTM.balanceOf(address)).to.not.equal(0)
};

describe("Solidly Integration test", function () {
  it("should swing WFTM to beFTM", async function () {
    const Adapter = await ethers.getContractFactory("SolidlyAdapter")
    const adapter = await Adapter.deploy(SOLIDLY_ROUTER)  

    await verifySwings(adapter.address)
  });
});

describe("SpiritSwap Integration test", function () {
  it("should swing WFTM to beFTM", async function () {
    const Adapter = await ethers.getContractFactory("UniswapAdapter")
    const adapter = await Adapter.deploy(SPIRITSWAP_ROUTER)

    await verifySwings(adapter.address)
  });
});

