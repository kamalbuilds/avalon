// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GameFactory is Ownable, ReentrancyGuard {
    struct GameConfig {
        uint256 maxPlayers;
        uint256 entryFee;
        uint256 roundDuration;
        bool vrfEnabled;
        bool stablecoinEnabled;
    }

    struct GameInfo {
        address gameAddress;
        string name;
        address creator;
        GameConfig config;
        uint256 createdAt;
        bool active;
    }

    mapping(uint256 => GameInfo) public games;
    mapping(address => uint256[]) public creatorGames;
    uint256 public gameCount;

    event GameCreated(uint256 indexed gameId, address indexed gameAddress, string name, address indexed creator);
    event GameUpdated(uint256 indexed gameId, string name, GameConfig config);
    event GameRemoved(uint256 indexed gameId);

    constructor() Ownable(msg.sender) {}

    function createGame(
        string calldata name,
        GameConfig calldata config
    ) external nonReentrant returns (uint256 gameId) {
        require(bytes(name).length > 0, "GameFactory: empty name");
        require(config.maxPlayers >= 2, "GameFactory: need >= 2 players");

        gameId = gameCount++;

        // Deploy a minimal proxy or record the game
        // In production, this would deploy an AvaForgeGame clone
        games[gameId] = GameInfo({
            gameAddress: address(0), // Set after deployment
            name: name,
            creator: msg.sender,
            config: config,
            createdAt: block.timestamp,
            active: true
        });

        creatorGames[msg.sender].push(gameId);

        emit GameCreated(gameId, address(0), name, msg.sender);
        return gameId;
    }

    function setGameAddress(uint256 gameId, address gameAddress) external onlyOwner {
        require(gameId < gameCount, "GameFactory: invalid game");
        games[gameId].gameAddress = gameAddress;
    }

    function updateGame(
        uint256 gameId,
        string calldata name,
        GameConfig calldata config
    ) external {
        require(gameId < gameCount, "GameFactory: invalid game");
        GameInfo storage game = games[gameId];
        require(msg.sender == game.creator || msg.sender == owner(), "GameFactory: not authorized");
        require(game.active, "GameFactory: game removed");

        game.name = name;
        game.config = config;

        emit GameUpdated(gameId, name, config);
    }

    function removeGame(uint256 gameId) external {
        require(gameId < gameCount, "GameFactory: invalid game");
        GameInfo storage game = games[gameId];
        require(msg.sender == game.creator || msg.sender == owner(), "GameFactory: not authorized");

        game.active = false;
        emit GameRemoved(gameId);
    }

    function getGame(uint256 gameId) external view returns (GameInfo memory) {
        require(gameId < gameCount, "GameFactory: invalid game");
        return games[gameId];
    }

    function getCreatorGames(address creator) external view returns (uint256[] memory) {
        return creatorGames[creator];
    }

    function getActiveGames() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < gameCount; i++) {
            if (games[i].active) activeCount++;
        }

        uint256[] memory activeGames = new uint256[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < gameCount; i++) {
            if (games[i].active) {
                activeGames[idx++] = i;
            }
        }
        return activeGames;
    }
}
