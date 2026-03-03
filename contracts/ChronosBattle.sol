// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChronosBattle
 * @notice Time-based tactical battle game. Moves have different speeds and costs.
 *         FAST = 1 block delay (high cost), MEDIUM = 3 blocks, SLOW = 6 blocks (low cost).
 */
contract ChronosBattle is Ownable, ReentrancyGuard {
    enum MoveType { FAST, MEDIUM, SLOW }
    enum MatchState { WAITING, ACTIVE, COMPLETED }

    struct MoveInFlight {
        MoveType moveType;
        bytes32 moveData;
        uint256 executeBlock;
        bool executed;
        uint256 damage;
    }

    struct PlayerState {
        uint256 health;
        uint256 energy;
        bool registered;
        uint256 movesSubmitted;
    }

    struct Match {
        address player1;
        address player2;
        MatchState state;
        address winner;
        uint256 prizePool;
        uint256 startBlock;
    }

    // Move costs and delays
    uint256 public constant FAST_COST = 30;
    uint256 public constant MEDIUM_COST = 20;
    uint256 public constant SLOW_COST = 10;

    uint256 public constant FAST_DELAY = 1;
    uint256 public constant MEDIUM_DELAY = 3;
    uint256 public constant SLOW_DELAY = 6;

    uint256 public constant FAST_DAMAGE = 15;
    uint256 public constant MEDIUM_DAMAGE = 25;
    uint256 public constant SLOW_DAMAGE = 40;

    uint256 public constant STARTING_HEALTH = 100;
    uint256 public constant STARTING_ENERGY = 100;
    uint256 public constant ENERGY_REGEN_PER_BLOCK = 2;

    // State
    mapping(uint256 => Match) public matches;
    mapping(uint256 => mapping(address => PlayerState)) public playerStates;
    mapping(uint256 => mapping(address => MoveInFlight[])) public movesInFlight;
    uint256 public matchCount;

    uint256 public entryFee;
    uint16 public platformFeeBps = 500; // 5%
    address public treasury;

    event MatchCreated(uint256 indexed matchId, address indexed player1);
    event MatchJoined(uint256 indexed matchId, address indexed player2);
    event MatchStarted(uint256 indexed matchId);
    event MoveSubmitted(uint256 indexed matchId, address indexed player, MoveType moveType, uint256 executeBlock);
    event MoveExecuted(uint256 indexed matchId, address indexed player, uint256 damage, uint256 targetHealth);
    event MatchCompleted(uint256 indexed matchId, address indexed winner, uint256 prize);

    constructor(uint256 _entryFee, address _treasury) Ownable(msg.sender) {
        entryFee = _entryFee;
        treasury = _treasury;
    }

    function createMatch() external payable returns (uint256 matchId) {
        require(msg.value >= entryFee, "ChronosBattle: insufficient fee");

        matchId = matchCount++;
        matches[matchId] = Match({
            player1: msg.sender,
            player2: address(0),
            state: MatchState.WAITING,
            winner: address(0),
            prizePool: msg.value,
            startBlock: 0
        });

        playerStates[matchId][msg.sender] = PlayerState({
            health: STARTING_HEALTH,
            energy: STARTING_ENERGY,
            registered: true,
            movesSubmitted: 0
        });

        emit MatchCreated(matchId, msg.sender);
        return matchId;
    }

    function joinMatch(uint256 matchId) external payable {
        Match storage m = matches[matchId];
        require(m.state == MatchState.WAITING, "ChronosBattle: not waiting");
        require(m.player1 != msg.sender, "ChronosBattle: cannot join own match");
        require(msg.value >= entryFee, "ChronosBattle: insufficient fee");

        m.player2 = msg.sender;
        m.prizePool += msg.value;
        m.state = MatchState.ACTIVE;
        m.startBlock = block.number;

        playerStates[matchId][msg.sender] = PlayerState({
            health: STARTING_HEALTH,
            energy: STARTING_ENERGY,
            registered: true,
            movesSubmitted: 0
        });

        emit MatchJoined(matchId, msg.sender);
        emit MatchStarted(matchId);
    }

    function submitMove(
        uint256 matchId,
        MoveType moveType,
        bytes32 moveData
    ) external {
        Match storage m = matches[matchId];
        require(m.state == MatchState.ACTIVE, "ChronosBattle: not active");
        require(
            msg.sender == m.player1 || msg.sender == m.player2,
            "ChronosBattle: not a player"
        );

        PlayerState storage ps = playerStates[matchId][msg.sender];

        // Calculate current energy with regen
        uint256 currentEnergy = _getCurrentEnergy(matchId, msg.sender);
        uint256 cost = _getMoveCost(moveType);
        require(currentEnergy >= cost, "ChronosBattle: insufficient energy");

        // Deduct energy
        ps.energy = currentEnergy - cost;

        // Calculate execute block
        uint256 delay = _getMoveDelay(moveType);
        uint256 executeBlock = block.number + delay;
        uint256 damage = _getMoveDamage(moveType);

        movesInFlight[matchId][msg.sender].push(MoveInFlight({
            moveType: moveType,
            moveData: moveData,
            executeBlock: executeBlock,
            executed: false,
            damage: damage
        }));

        ps.movesSubmitted++;

        emit MoveSubmitted(matchId, msg.sender, moveType, executeBlock);
    }

    function executeMove(uint256 matchId, address player, uint256 moveIndex) external {
        Match storage m = matches[matchId];
        require(m.state == MatchState.ACTIVE, "ChronosBattle: not active");

        MoveInFlight storage move = movesInFlight[matchId][player][moveIndex];
        require(!move.executed, "ChronosBattle: already executed");
        require(block.number >= move.executeBlock, "ChronosBattle: too early");

        move.executed = true;

        // Apply damage to opponent
        address target = player == m.player1 ? m.player2 : m.player1;
        PlayerState storage targetState = playerStates[matchId][target];

        if (targetState.health <= move.damage) {
            targetState.health = 0;
        } else {
            targetState.health -= move.damage;
        }

        emit MoveExecuted(matchId, player, move.damage, targetState.health);

        // Check win condition
        if (targetState.health == 0) {
            _endMatch(matchId, player);
        }
    }

    function _endMatch(uint256 matchId, address winner) internal nonReentrant {
        Match storage m = matches[matchId];
        m.state = MatchState.COMPLETED;
        m.winner = winner;

        uint256 platformFee = (m.prizePool * platformFeeBps) / 10000;
        uint256 prize = m.prizePool - platformFee;

        if (platformFee > 0 && treasury != address(0)) {
            (bool sent1, ) = treasury.call{value: platformFee}("");
            require(sent1, "ChronosBattle: treasury transfer failed");
        }

        (bool sent2, ) = winner.call{value: prize}("");
        require(sent2, "ChronosBattle: prize transfer failed");

        emit MatchCompleted(matchId, winner, prize);
    }

    // --- Helpers ---

    function _getMoveCost(MoveType moveType) internal pure returns (uint256) {
        if (moveType == MoveType.FAST) return FAST_COST;
        if (moveType == MoveType.MEDIUM) return MEDIUM_COST;
        return SLOW_COST;
    }

    function _getMoveDelay(MoveType moveType) internal pure returns (uint256) {
        if (moveType == MoveType.FAST) return FAST_DELAY;
        if (moveType == MoveType.MEDIUM) return MEDIUM_DELAY;
        return SLOW_DELAY;
    }

    function _getMoveDamage(MoveType moveType) internal pure returns (uint256) {
        if (moveType == MoveType.FAST) return FAST_DAMAGE;
        if (moveType == MoveType.MEDIUM) return MEDIUM_DAMAGE;
        return SLOW_DAMAGE;
    }

    function _getCurrentEnergy(uint256 matchId, address player) internal view returns (uint256) {
        Match storage m = matches[matchId];
        PlayerState storage ps = playerStates[matchId][player];

        uint256 blocksElapsed = block.number - m.startBlock;
        uint256 regenEnergy = blocksElapsed * ENERGY_REGEN_PER_BLOCK;
        uint256 totalEnergy = ps.energy + regenEnergy;

        return totalEnergy > STARTING_ENERGY ? STARTING_ENERGY : totalEnergy;
    }

    // --- Views ---

    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function getPlayerState(uint256 matchId, address player) external view returns (PlayerState memory) {
        return playerStates[matchId][player];
    }

    function getMovesInFlight(uint256 matchId, address player) external view returns (MoveInFlight[] memory) {
        return movesInFlight[matchId][player];
    }

    function getCurrentEnergy(uint256 matchId, address player) external view returns (uint256) {
        return _getCurrentEnergy(matchId, player);
    }

    // --- Admin ---

    function setEntryFee(uint256 _entryFee) external onlyOwner {
        entryFee = _entryFee;
    }

    function setPlatformFeeBps(uint16 _feeBps) external onlyOwner {
        require(_feeBps <= 2000, "ChronosBattle: fee too high"); // max 20%
        platformFeeBps = _feeBps;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    receive() external payable {}
}
