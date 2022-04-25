import { ethers } from "hardhat";
import {  WFTM_ADDRESS, BEFTM_ADDRESS, SOLIDLY_ROUTER } from "../scripts/abi";

async function main() {
  const Swinger = await ethers.getContractFactory("Swinger");
  const swinger = await Swinger.deploy(WFTM_ADDRESS, BEFTM_ADDRESS, SOLIDLY_ROUTER, true);

  await swinger.deployed();

  console.log("deployed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
