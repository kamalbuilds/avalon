/**
 * Complete VRF Setup Script
 * Creates a VRF v2.5 subscription, adds LootVRF as consumer,
 * sets the subscription ID on the contract, and updates config files.
 *
 * Usage:
 *   TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat run contracts/scripts/setup-vrf-complete.ts --network fuji
 */
import pkg from "hardhat";
const { ethers } = pkg;
import * as fs from "fs";
import * as path from "path";

const LOOT_VRF_ADDRESS = "0xc39d9Ec925d3AA6E67FE760630406696408724f8";
const VRF_COORDINATOR_ADDRESS = "0x2eD832bA664535E5AB023B4EaDAb0E4F6F4A8B16";

// Minimal ABI for VRF Coordinator v2.5 subscription management
const VRF_COORDINATOR_ABI = [
  "function createSubscription() external returns (uint256 subId)",
  "function addConsumer(uint256 subId, address consumer) external",
  "function getSubscription(uint256 subId) external view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address subOwner, address[] memory consumers)",
  "function fundSubscriptionWithNative(uint256 subId) external payable",
  "event SubscriptionCreated(uint256 indexed subId, address owner)",
];

// Minimal ABI for LootVRF
const LOOT_VRF_ABI = [
  "function setSubscriptionId(uint256 _subscriptionId) external",
  "function subscriptionId() external view returns (uint256)",
  "function owner() external view returns (address)",
];

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("=== Chainlink VRF v2.5 Complete Setup ===");
  console.log("Signer:", signer.address);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log("AVAX Balance:", ethers.formatEther(balance), "AVAX");

  if (balance === 0n) {
    console.error("No AVAX balance. Get Fuji testnet AVAX from https://core.app/tools/testnet-faucet/");
    process.exit(1);
  }

  const vrfCoordinator = new ethers.Contract(VRF_COORDINATOR_ADDRESS, VRF_COORDINATOR_ABI, signer);
  const lootVRF = new ethers.Contract(LOOT_VRF_ADDRESS, LOOT_VRF_ABI, signer);

  // Check ownership
  const owner = await lootVRF.owner();
  console.log("LootVRF owner:", owner);
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.error(`Signer ${signer.address} is not the owner ${owner}. Cannot configure.`);
    process.exit(1);
  }

  // Step 1: Create VRF Subscription
  console.log("\n--- Step 1: Creating VRF Subscription ---");
  const createTx = await vrfCoordinator.createSubscription();
  const receipt = await createTx.wait();

  // Parse the SubscriptionCreated event to get the subscription ID
  let subscriptionId: bigint | null = null;
  for (const log of receipt.logs) {
    try {
      const parsed = vrfCoordinator.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      if (parsed && parsed.name === "SubscriptionCreated") {
        subscriptionId = parsed.args.subId;
        break;
      }
    } catch {
      // Not our event, skip
    }
  }

  if (!subscriptionId) {
    console.error("Failed to parse SubscriptionCreated event from tx:", createTx.hash);
    process.exit(1);
  }

  console.log("Subscription created! ID:", subscriptionId.toString());
  console.log("Create tx:", createTx.hash);

  // Step 2: Fund with native AVAX (0.5 AVAX for testing)
  console.log("\n--- Step 2: Funding subscription with native AVAX ---");
  const fundAmount = ethers.parseEther("0.5");
  const fundTx = await vrfCoordinator.fundSubscriptionWithNative(subscriptionId, {
    value: fundAmount,
  });
  await fundTx.wait();
  console.log("Funded with 0.5 AVAX. tx:", fundTx.hash);

  // Step 3: Add LootVRF as consumer
  console.log("\n--- Step 3: Adding LootVRF as consumer ---");
  const addTx = await vrfCoordinator.addConsumer(subscriptionId, LOOT_VRF_ADDRESS);
  await addTx.wait();
  console.log("LootVRF added as consumer. tx:", addTx.hash);

  // Step 4: Set subscription ID on LootVRF contract
  console.log("\n--- Step 4: Setting subscription ID on LootVRF contract ---");
  const setTx = await lootVRF.setSubscriptionId(subscriptionId);
  await setTx.wait();
  console.log("Subscription ID set on contract. tx:", setTx.hash);

  // Verify
  const currentId = await lootVRF.subscriptionId();
  console.log("Verified subscriptionId on contract:", currentId.toString());

  // Step 5: Verify subscription state
  console.log("\n--- Step 5: Verifying subscription ---");
  const sub = await vrfCoordinator.getSubscription(subscriptionId);
  console.log("Balance:", ethers.formatEther(sub[0]), "LINK");
  console.log("Native Balance:", ethers.formatEther(sub[1]), "AVAX");
  console.log("Request Count:", sub[2].toString());
  console.log("Owner:", sub[3]);
  console.log("Consumers:", sub[4]);

  // Step 6: Update config files
  const subIdStr = subscriptionId.toString();
  console.log("\n--- Step 6: Updating config files ---");

  // Update .env.local
  const envPath = path.resolve(__dirname, "../../.env.local");
  let envContent = fs.readFileSync(envPath, "utf-8");
  envContent = envContent.replace(
    /VRF_SUBSCRIPTION_ID=.*/,
    `VRF_SUBSCRIPTION_ID=${subIdStr}`
  );
  fs.writeFileSync(envPath, envContent);
  console.log("Updated .env.local with VRF_SUBSCRIPTION_ID=" + subIdStr);

  // Update constants.ts
  const constantsPath = path.resolve(__dirname, "../../src/lib/constants.ts");
  if (fs.existsSync(constantsPath)) {
    let constantsContent = fs.readFileSync(constantsPath, "utf-8");
    constantsContent = constantsContent.replace(
      /VRF_SUBSCRIPTION_ID:\s*\d+/,
      `VRF_SUBSCRIPTION_ID: ${subIdStr}`
    );
    fs.writeFileSync(constantsPath, constantsContent);
    console.log("Updated constants.ts with VRF_SUBSCRIPTION_ID=" + subIdStr);
  }

  // Update VRF-STATUS.md
  const statusPath = path.resolve(__dirname, "../VRF-STATUS.md");
  const statusContent = `# Chainlink VRF v2.5 Fuji Status

## Current State LIVE
- **VRF Subscription**: ACTIVE on Fuji (v2.5)
- **Subscription ID**: ${subIdStr}
- **LootVRF Contract**: \`${LOOT_VRF_ADDRESS}\` (consumer added)
- **VRF Coordinator**: \`${VRF_COORDINATOR_ADDRESS}\`
- **Key Hash**: \`0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61\` (200 gwei)
- **Native Balance**: 0.5 AVAX
- **Deployer/Owner**: \`${signer.address}\`
- **Setup Date**: ${new Date().toISOString()}

## Setup Complete
All steps automated by \`setup-vrf-complete.ts\`:
1. Created VRF subscription (ID: ${subIdStr})
2. Funded with 0.5 AVAX (native payment)
3. Added LootVRF as consumer
4. Set subscription ID on LootVRF contract
5. Updated .env.local and constants.ts

## Transaction Hashes
- Create Subscription: \`${createTx.hash}\`
- Fund Subscription: \`${fundTx.hash}\`
- Add Consumer: \`${addTx.hash}\`
- Set Subscription ID: \`${setTx.hash}\`
`;
  fs.writeFileSync(statusPath, statusContent);
  console.log("Updated VRF-STATUS.md");

  console.log("\n=== VRF SETUP COMPLETE ===");
  console.log("Subscription ID:", subIdStr);
  console.log("LootVRF is ready to receive VRF randomness!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
