const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    
    const Healthcare = await ethers.getContractFactory("Healthcare");
    const healthcare = await Healthcare.deploy();

    await healthcare.waitForDeployment();
    console.log("Healthcare contract deployed to:", await healthcare.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
