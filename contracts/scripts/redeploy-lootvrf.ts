import pkg from "hardhat";
const { ethers, network } = pkg;
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Redeploying LootVRF with account:", deployer.address);
  console.log("Network:", network.name);

  const VRF_COORDINATOR_FUJI = "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE";
  const VRF_KEY_HASH = "0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887";
  const VRF_SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID ? BigInt(process.env.VRF_SUBSCRIPTION_ID) : 0n;

  const vrfCoordinator = network.name === "hardhat" || network.name === "localhost"
    ? deployer.address
    : VRF_COORDINATOR_FUJI;

  console.log("VRF Subscription ID:", VRF_SUBSCRIPTION_ID.toString());
  console.log("VRF Coordinator:", vrfCoordinator);

  const LootVRF = await ethers.getContractFactory("LootVRF");
  const lootVRF = await LootVRF.deploy(VRF_SUBSCRIPTION_ID, vrfCoordinator, VRF_KEY_HASH);
  await lootVRF.waitForDeployment();
  const lootVRFAddr = await lootVRF.getAddress();
  console.log("LootVRF redeployed to:", lootVRFAddr);

  // Update deployed-addresses.json
  const jsonPath = path.resolve("contracts/deployed-addresses.json");
  if (fs.existsSync(jsonPath)) {
    const deployed = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    deployed.lootVRF = lootVRFAddr;
    deployed.timestamp = new Date().toISOString();
    fs.writeFileSync(jsonPath, JSON.stringify(deployed, null, 2));
    console.log("Updated deployed-addresses.json");
  }

  // Update addresses.ts
  if (network.name === "fuji" || network.name === "avalanche") {
    const addressesPath = path.resolve("src/lib/contracts/addresses.ts");
    if (fs.existsSync(addressesPath)) {
      let content = fs.readFileSync(addressesPath, "utf-8");
      content = content.replace(/lootVRF: "0x[a-fA-F0-9]+"/, `lootVRF: "${lootVRFAddr}"`);
      fs.writeFileSync(addressesPath, content);
      console.log("Updated addresses.ts");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
