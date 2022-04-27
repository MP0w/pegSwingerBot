import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@tenderly/hardhat-tenderly"
import "@nomiclabs/hardhat-ganache";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config = {
  solidity: "0.8.4",
  defaultNetwork: "localhost",
  networks: {
    ganache: {
      url: "http://127.0.0.1:8545",
      defaultBalanceEther: 1000,
      fork: "https://rpc.ftm.tools",
      forkBlockNumber: "37207966"
    },
    localhost: {
      defaultBalanceEther: 1000,
      fork: "https://rpc.ftm.tools",
      forkBlockNumber: "37207966"
    },
    fantom: {
      url: "https://rpc.ftm.tools",
      accounts: { mnemonic: process.env.MNEMONIC_WALLET }
    }
  },
  tenderly: {
		username: "mpow",
		project: "bot"
	},
  etherscan: {
    apiKey: {
      opera: process.env.FTMSCAN_KEY,
    }
  },
};

export default config;
