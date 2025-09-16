const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy GameToken first
  console.log("\n📄 Deploying GameToken...");
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  await gameToken.waitForDeployment();
  const gameTokenAddress = await gameToken.getAddress();
  console.log("✅ GameToken deployed to:", gameTokenAddress);

  // Deploy GM Game
  console.log("\n🌅 Deploying GMGame...");
  const GMGame = await ethers.getContractFactory("GMGame");
  const gmGame = await GMGame.deploy(gameTokenAddress);
  await gmGame.waitForDeployment();
  const gmGameAddress = await gmGame.getAddress();
  console.log("✅ GMGame deployed to:", gmGameAddress);

  // Deploy GN Game
  console.log("\n🌙 Deploying GNGame...");
  const GNGame = await ethers.getContractFactory("GNGame");
  const gnGame = await GNGame.deploy(gameTokenAddress);
  await gnGame.waitForDeployment();
  const gnGameAddress = await gnGame.getAddress();
  console.log("✅ GNGame deployed to:", gnGameAddress);

  // Deploy Flip Game
  console.log("\n🪙 Deploying FlipGame...");
  const FlipGame = await ethers.getContractFactory("FlipGame");
  const flipGame = await FlipGame.deploy(gameTokenAddress);
  await flipGame.waitForDeployment();
  const flipGameAddress = await flipGame.getAddress();
  console.log("✅ FlipGame deployed to:", flipGameAddress);

  // Deploy Lucky Number Game
  console.log("\n🎲 Deploying LuckyNumber...");
  const LuckyNumber = await ethers.getContractFactory("LuckyNumber");
  const luckyNumber = await LuckyNumber.deploy(gameTokenAddress);
  await luckyNumber.waitForDeployment();
  const luckyNumberAddress = await luckyNumber.getAddress();
  console.log("✅ LuckyNumber deployed to:", luckyNumberAddress);

  // Deploy Dice Roll Game
  console.log("\n🎲 Deploying DiceRoll...");
  const DiceRoll = await ethers.getContractFactory("DiceRoll");
  const diceRoll = await DiceRoll.deploy(gameTokenAddress);
  await diceRoll.waitForDeployment();
  const diceRollAddress = await diceRoll.getAddress();
  console.log("✅ DiceRoll deployed to:", diceRollAddress);

  // Add game contracts to GameToken
  console.log("\n🔗 Adding game contracts to GameToken...");
  await gameToken.addGameContract(gmGameAddress);
  await gameToken.addGameContract(gnGameAddress);
  await gameToken.addGameContract(flipGameAddress);
  await gameToken.addGameContract(luckyNumberAddress);
  await gameToken.addGameContract(diceRollAddress);
  console.log("✅ All game contracts added to GameToken");

  // Print summary
  console.log("\n🎉 Deployment Summary:");
  console.log("=====================");
  console.log("GameToken:", gameTokenAddress);
  console.log("GMGame:", gmGameAddress);
  console.log("GNGame:", gnGameAddress);
  console.log("FlipGame:", flipGameAddress);
  console.log("LuckyNumber:", luckyNumberAddress);
  console.log("DiceRoll:", diceRollAddress);
  console.log("\n📋 Copy these addresses to your config file!");

  // Save addresses to file
  const addresses = {
    GameToken: gameTokenAddress,
    GMGame: gmGameAddress,
    GNGame: gnGameAddress,
    FlipGame: flipGameAddress,
    LuckyNumber: luckyNumberAddress,
    DiceRoll: diceRollAddress,
    network: await deployer.provider.getNetwork()
  };

  const fs = require('fs');
  fs.writeFileSync(
    './deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
