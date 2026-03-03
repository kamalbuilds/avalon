// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AvaForgeGame is Ownable, Pausable, ReentrancyGuard {
    enum GameState { WAITING, ACTIVE, COMPLETED, CANCELLED }

    struct Player {
        address addr;
        uint256 score;
        bool registered;
        uint256 joinedAt;
    }

    struct GameConfig {
        uint256 maxPlayers;
        uint256 entryFee;
        uint256 roundDuration;
        bool vrfEnabled;
        bool stablecoinEnabled;
    }

    string public gameName;
    GameConfig public config;
    GameState public state;
    uint256 public currentRound;
    uint256 public roundStartTime;

    mapping(address => Player) public players;
    address[] public playerList;

    address public vrfConsumer;
    address public economyContract;

    event PlayerRegistered(address indexed player);
    event GameStarted(uint256 timestamp);
    event RoundStarted(uint256 round, uint256 timestamp);
    event MoveSubmitted(address indexed player, bytes32 moveHash);
    event MoveExecuted(address indexed player, uint256 round);
    event ScoreUpdated(address indexed player, uint256 newScore);
    event GameCompleted(address indexed winner, uint256 prize);
    event GameCancelled();

    modifier onlyRegistered() {
        require(players[msg.sender].registered, "AvaForgeGame: not registered");
        _;
    }

    modifier inState(GameState _state) {
        require(state == _state, "AvaForgeGame: wrong state");
        _;
    }

    constructor(
        string memory _name,
        GameConfig memory _config,
        address _owner
    ) Ownable(_owner) {
        gameName = _name;
        config = _config;
        state = GameState.WAITING;
    }

    function registerPlayer() external payable inState(GameState.WAITING) whenNotPaused {
        require(!players[msg.sender].registered, "AvaForgeGame: already registered");
        require(playerList.length < config.maxPlayers, "AvaForgeGame: game full");

        if (config.entryFee > 0 && !config.stablecoinEnabled) {
            require(msg.value >= config.entryFee, "AvaForgeGame: insufficient fee");
        }

        players[msg.sender] = Player({
            addr: msg.sender,
            score: 0,
            registered: true,
            joinedAt: block.timestamp
        });

        playerList.push(msg.sender);
        emit PlayerRegistered(msg.sender);
    }

    function startGame() external onlyOwner inState(GameState.WAITING) {
        require(playerList.length >= 2, "AvaForgeGame: need >= 2 players");
        state = GameState.ACTIVE;
        currentRound = 1;
        roundStartTime = block.timestamp;

        emit GameStarted(block.timestamp);
        emit RoundStarted(1, block.timestamp);
    }

    function submitMove(bytes32 moveHash) external onlyRegistered inState(GameState.ACTIVE) whenNotPaused {
        emit MoveSubmitted(msg.sender, moveHash);
    }

    function executeMove(
        address player,
        uint256 scoreChange
    ) external onlyOwner inState(GameState.ACTIVE) {
        require(players[player].registered, "AvaForgeGame: player not registered");

        players[player].score += scoreChange;
        emit MoveExecuted(player, currentRound);
        emit ScoreUpdated(player, players[player].score);
    }

    function nextRound() external onlyOwner inState(GameState.ACTIVE) {
        require(
            block.timestamp >= roundStartTime + config.roundDuration,
            "AvaForgeGame: round not over"
        );

        currentRound++;
        roundStartTime = block.timestamp;
        emit RoundStarted(currentRound, block.timestamp);
    }

    function completeGame(address winner) external onlyOwner inState(GameState.ACTIVE) nonReentrant {
        require(players[winner].registered, "AvaForgeGame: winner not registered");

        state = GameState.COMPLETED;

        uint256 prize = address(this).balance;
        if (prize > 0) {
            (bool sent, ) = winner.call{value: prize}("");
            require(sent, "AvaForgeGame: prize transfer failed");
        }

        emit GameCompleted(winner, prize);
    }

    function cancelGame() external onlyOwner nonReentrant {
        require(state == GameState.WAITING || state == GameState.ACTIVE, "AvaForgeGame: cannot cancel");

        state = GameState.CANCELLED;

        // Refund entry fees
        if (config.entryFee > 0 && !config.stablecoinEnabled) {
            for (uint256 i = 0; i < playerList.length; i++) {
                (bool sent, ) = playerList[i].call{value: config.entryFee}("");
                require(sent, "AvaForgeGame: refund failed");
            }
        }

        emit GameCancelled();
    }

    function setVRFConsumer(address _vrfConsumer) external onlyOwner {
        vrfConsumer = _vrfConsumer;
    }

    function setEconomyContract(address _economyContract) external onlyOwner {
        economyContract = _economyContract;
    }

    function getPlayerCount() external view returns (uint256) {
        return playerList.length;
    }

    function getPlayers() external view returns (address[] memory) {
        return playerList;
    }

    function getPlayerScore(address player) external view returns (uint256) {
        require(players[player].registered, "AvaForgeGame: not registered");
        return players[player].score;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    receive() external payable {}
}
