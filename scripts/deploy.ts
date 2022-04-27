import { ethers, tenderly } from "hardhat";
import { WFTM_ADDRESS, BEFTM_ADDRESS, SOLIDLY_ROUTER } from "../scripts/abi";
import "@nomiclabs/hardhat-ganache";

async function main() {
  const Adapter = await ethers.getContractFactory("SolidlyAdapter")
  const adapter = await Adapter.deploy(SOLIDLY_ROUTER)
  await adapter.deployed()
  const Swinger = await ethers.getContractFactory("Swinger")
  const swinger = await Swinger.deploy(WFTM_ADDRESS, BEFTM_ADDRESS, adapter.address)
  await swinger.deployed()
    
  console.log("Swinger " + swinger.address)
  console.log("Adapter " + adapter.address)

  await tenderly.persistArtifacts({
    name: "Swinger",
    address: swinger.address
  });

  await tenderly.persistArtifacts({
    name: "SolidlyAdapter",
    address: adapter.address
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
