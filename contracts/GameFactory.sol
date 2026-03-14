// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./AvalonGame.sol";

/// @title GameFactory — deploys AvalonGame instances via EIP-1167 minimal proxies
/// @notice Each call to createGame deploys a cheap clone of the AvalonGame implementation.
///         On Avalanche L1 this means every game has its own sovereign contract with a
///         unique address, configured entry fee, and VRF/stablecoin flags.
contract GameFactory is Ownable, ReentrancyGuard {
    using Clones for address;

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

    /// @notice The AvalonGame implementation contract all clones point to
    address public immutable gameImplementation;

    mapping(uint256 => GameInfo) public games;
    mapping(address => uint256[]) public creatorGames;
    uint256 public gameCount;

    event GameCreated(uint256 indexed gameId, address indexed gameAddress, string name, address indexed creator);
    event GameUpdated(uint256 indexed gameId, string name, GameConfig config);
    event GameRemoved(uint256 indexed gameId);

    constructor(address _gameImplementation) Ownable(msg.sender) {
        require(_gameImplementation != address(0), "GameFactory: zero implementation");
        gameImplementation = _gameImplementation;
    }

    /// @notice Deploy a new AvalonGame clone and register it.
    ///         The clone is an EIP-1167 minimal proxy — gas cost ~200k vs ~1.5M for a full deploy.
    function createGame(
        string calldata name,
        GameConfig calldata config
    ) external nonReentrant returns (uint256 gameId, address gameAddress) {
        require(bytes(name).length > 0, "GameFactory: empty name");
        require(config.maxPlayers >= 2, "GameFactory: need >= 2 players");

        // Deploy EIP-1167 minimal proxy pointing to gameImplementation
        gameAddress = gameImplementation.clone();

        // Initialize the clone (proxies have no constructor)
        AvalonGame(payable(gameAddress)).initialize(name, _toAvalonConfig(config), msg.sender);

        gameId = gameCount++;

        games[gameId] = GameInfo({
            gameAddress: gameAddress,
            name: name,
            creator: msg.sender,
            config: config,
            createdAt: block.timestamp,
            active: true
        });

        creatorGames[msg.sender].push(gameId);

        emit GameCreated(gameId, gameAddress, name, msg.sender);
    }

    /// @dev Convert factory GameConfig to AvalonGame.GameConfig
    function _toAvalonConfig(GameConfig calldata c) internal pure returns (AvalonGame.GameConfig memory) {
        return AvalonGame.GameConfig({
            maxPlayers: c.maxPlayers,
            entryFee: c.entryFee,
            roundDuration: c.roundDuration,
            vrfEnabled: c.vrfEnabled,
            stablecoinEnabled: c.stablecoinEnabled
        });
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
