import { ethers } from "hardhat";

async function main() {
  const Swinger = await ethers.getContractFactory("Swinger");
  const swinger = await Swinger.deploy(
    "",
    "",
    ""
  );

  await swinger.deployed();

  console.log("deployed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
