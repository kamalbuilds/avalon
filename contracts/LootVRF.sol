// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LootVRF
 * @notice Chainlink VRF v2.5 consumer for provably fair loot drops
 */
contract LootVRF is VRFConsumerBaseV2Plus {
    enum Rarity { Common, Uncommon, Rare, Epic, Legendary }

    struct LootDrop {
        uint256 gameId;
        address player;
        Rarity rarity;
        uint256 lootId;
        bool fulfilled;
        uint256 randomWord;
    }

    struct LootTable {
        uint16 commonRate;     // basis points (e.g., 5000 = 50%)
        uint16 uncommonRate;   // e.g., 2500 = 25%
        uint16 rareRate;       // e.g., 1500 = 15%
        uint16 epicRate;       // e.g., 750 = 7.5%
        uint16 legendaryRate;  // e.g., 250 = 2.5%
    }

    // Chainlink VRF config
    uint256 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 200000;
    uint16 public requestConfirmations = 3;

    // State
    mapping(uint256 => LootDrop) public lootDrops; // requestId => LootDrop
    mapping(uint256 => LootTable) public lootTables; // gameId => LootTable
    mapping(address => uint256[]) public playerDrops;
    uint256 public totalDrops;

    // Default loot table
    LootTable public defaultLootTable;

    // Authorized game contracts
    mapping(address => bool) public authorizedGames;

    event LootRequested(uint256 indexed requestId, uint256 indexed gameId, address indexed player);
    event LootFulfilled(uint256 indexed requestId, Rarity rarity, uint256 lootId);
    event LootTableUpdated(uint256 indexed gameId, LootTable table);
    event GameAuthorized(address indexed game);
    event GameRevoked(address indexed game);

    constructor(
        uint256 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;

        // Default: 50% Common, 25% Uncommon, 15% Rare, 7.5% Epic, 2.5% Legendary
        defaultLootTable = LootTable({
            commonRate: 5000,
            uncommonRate: 2500,
            rareRate: 1500,
            epicRate: 750,
            legendaryRate: 250
        });
    }

    modifier onlyAuthorizedGame() {
        require(authorizedGames[msg.sender], "LootVRF: not authorized");
        _;
    }

    function requestRandomLoot(
        uint256 gameId,
        address player
    ) external onlyAuthorizedGame returns (uint256 requestId) {
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: 1,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        lootDrops[requestId] = LootDrop({
            gameId: gameId,
            player: player,
            rarity: Rarity.Common,
            lootId: 0,
            fulfilled: false,
            randomWord: 0
        });

        emit LootRequested(requestId, gameId, player);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        LootDrop storage drop = lootDrops[requestId];
        require(!drop.fulfilled, "LootVRF: already fulfilled");

        drop.randomWord = randomWords[0];
        drop.fulfilled = true;

        // Determine rarity from random number
        LootTable memory table = lootTables[drop.gameId].commonRate > 0
            ? lootTables[drop.gameId]
            : defaultLootTable;

        drop.rarity = _determineRarity(randomWords[0], table);
        drop.lootId = totalDrops++;

        playerDrops[drop.player].push(requestId);

        emit LootFulfilled(requestId, drop.rarity, drop.lootId);
    }

    function _determineRarity(
        uint256 randomValue,
        LootTable memory table
    ) internal pure returns (Rarity) {
        uint256 roll = randomValue % 10000;

        if (roll < table.legendaryRate) return Rarity.Legendary;
        if (roll < table.legendaryRate + table.epicRate) return Rarity.Epic;
        if (roll < table.legendaryRate + table.epicRate + table.rareRate) return Rarity.Rare;
        if (roll < table.legendaryRate + table.epicRate + table.rareRate + table.uncommonRate) return Rarity.Uncommon;
        return Rarity.Common;
    }

    // --- Admin (owner-only via ConfirmedOwner from VRFConsumerBaseV2Plus) ---

    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    function setLootTable(uint256 gameId, LootTable calldata table) external onlyOwner {
        require(
            table.commonRate + table.uncommonRate + table.rareRate + table.epicRate + table.legendaryRate == 10000,
            "LootVRF: rates must sum to 10000"
        );
        lootTables[gameId] = table;
        emit LootTableUpdated(gameId, table);
    }

    function authorizeGame(address game) external onlyOwner {
        authorizedGames[game] = true;
        emit GameAuthorized(game);
    }

    function revokeGame(address game) external onlyOwner {
        authorizedGames[game] = false;
        emit GameRevoked(game);
    }

    function setCallbackGasLimit(uint32 _gasLimit) external onlyOwner {
        callbackGasLimit = _gasLimit;
    }

    function setRequestConfirmations(uint16 _confirmations) external onlyOwner {
        requestConfirmations = _confirmations;
    }

    // --- Views ---

    function getLootDrop(uint256 requestId) external view returns (LootDrop memory) {
        return lootDrops[requestId];
    }

    function getPlayerDrops(address player) external view returns (uint256[] memory) {
        return playerDrops[player];
    }
}
