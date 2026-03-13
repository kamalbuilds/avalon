// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChronosBattle
 * @notice Time-based tactical battle game where blockchain latency IS the mechanic.
 *         5 moves: Quick Strike (instant, cheap), Power Blow (3-block delay),
 *         Devastating Attack (6-block delay, expensive), Shield (2-block activation),
 *         Counter (instant, doubles opponent's in-flight damage).
 *         Economy uses coins (earned per block) not energy.
 */
contract ChronosBattle is Ownable, ReentrancyGuard {
    enum MoveType { QUICK_STRIKE, POWER_BLOW, DEVASTATING_ATTACK, SHIELD, COUNTER }
    enum MatchState { WAITING, ACTIVE, COMPLETED, CANCELLED }

    struct MoveInFlight {
        MoveType moveType;
        bytes32 moveData;
        uint256 executeBlock;
        bool executed;
        uint256 damage;
    }

    struct PlayerState {
        uint256 health;
        uint256 coins;
        bool registered;
        bool shieldActive;
        uint256 movesSubmitted;
    }

    struct Match {
        address player1;
        address player2;
        MatchState state;
        address winner;
        uint256 prizePool;
        uint256 startBlock;
        uint256 createdBlock;
    }

    // Move costs (in coins) - matches frontend moves.ts
    uint256 public constant QUICK_STRIKE_COST = 1;
    uint256 public constant POWER_BLOW_COST = 2;
    uint256 public constant DEVASTATING_ATTACK_COST = 3;
    uint256 public constant SHIELD_COST = 1;
    uint256 public constant COUNTER_COST = 2;

    // Move delays (in blocks) - 0 = instant
    uint256 public constant QUICK_STRIKE_DELAY = 0;
    uint256 public constant POWER_BLOW_DELAY = 3;
    uint256 public constant DEVASTATING_ATTACK_DELAY = 6;
    uint256 public constant SHIELD_DELAY = 2;
    uint256 public constant COUNTER_DELAY = 0;

    // Move damage
    uint256 public constant QUICK_STRIKE_DAMAGE = 10;
    uint256 public constant POWER_BLOW_DAMAGE = 25;
    uint256 public constant DEVASTATING_ATTACK_DAMAGE = 50;
    uint256 public constant COUNTER_MULTIPLIER = 2;

    // Game constants - matches frontend moves.ts
    uint256 public constant STARTING_HEALTH = 100;
    uint256 public constant STARTING_COINS = 10;
    uint256 public constant COINS_PER_BLOCK = 1;
    uint256 public constant MAX_COINS = 20;

    /// @notice Blocks before a WAITING match can be cancelled (~5 minutes on Avalanche C-Chain)
    uint256 public constant CANCEL_TIMEOUT_BLOCKS = 100;

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
    event ShieldActivated(uint256 indexed matchId, address indexed player);
    event ShieldBroken(uint256 indexed matchId, address indexed player);
    event CounterSuccess(uint256 indexed matchId, address indexed player, uint256 damage);
    event CounterMiss(uint256 indexed matchId, address indexed player);
    event MatchCompleted(uint256 indexed matchId, address indexed winner, uint256 prize);
    event MatchCancelled(uint256 indexed matchId, address indexed player1, uint256 refund);

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
            startBlock: 0,
            createdBlock: block.number
        });

        playerStates[matchId][msg.sender] = PlayerState({
            health: STARTING_HEALTH,
            coins: STARTING_COINS,
            registered: true,
            shieldActive: false,
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
            coins: STARTING_COINS,
            registered: true,
            shieldActive: false,
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

        // Calculate current coins with per-block income
        uint256 currentCoins = _getCurrentCoins(matchId, msg.sender);
        uint256 cost = _getMoveCost(moveType);
        require(currentCoins >= cost, "ChronosBattle: insufficient coins");

        // Deduct coins
        ps.coins = currentCoins - cost;

        address opponent = msg.sender == m.player1 ? m.player2 : m.player1;

        if (moveType == MoveType.COUNTER) {
            // Counter is instant - check if opponent has unexecuted moves in flight
            MoveInFlight[] storage opponentMoves = movesInFlight[matchId][opponent];
            uint256 strongestDamage = 0;
            bool foundTarget = false;

            for (uint256 i = 0; i < opponentMoves.length; i++) {
                if (!opponentMoves[i].executed && opponentMoves[i].damage > strongestDamage) {
                    strongestDamage = opponentMoves[i].damage;
                    foundTarget = true;
                }
            }

            if (foundTarget) {
                uint256 counterDamage = strongestDamage * COUNTER_MULTIPLIER;
                PlayerState storage opponentState = playerStates[matchId][opponent];

                if (opponentState.shieldActive) {
                    opponentState.shieldActive = false;
                    emit ShieldBroken(matchId, opponent);
                } else {
                    if (opponentState.health <= counterDamage) {
                        opponentState.health = 0;
                    } else {
                        opponentState.health -= counterDamage;
                    }
                    emit CounterSuccess(matchId, msg.sender, counterDamage);
                    emit MoveExecuted(matchId, msg.sender, counterDamage, opponentState.health);
                }
            } else {
                emit CounterMiss(matchId, msg.sender);
            }
        } else if (moveType == MoveType.QUICK_STRIKE) {
            // Quick Strike is instant damage
            PlayerState storage opponentState = playerStates[matchId][opponent];
            uint256 damage = QUICK_STRIKE_DAMAGE;

            if (opponentState.shieldActive) {
                opponentState.shieldActive = false;
                emit ShieldBroken(matchId, opponent);
            } else {
                if (opponentState.health <= damage) {
                    opponentState.health = 0;
                } else {
                    opponentState.health -= damage;
                }
                emit MoveExecuted(matchId, msg.sender, damage, opponentState.health);
            }
        } else {
            // Delayed moves: Power Blow, Devastating Attack, Shield
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

            emit MoveSubmitted(matchId, msg.sender, moveType, executeBlock);
        }

        ps.movesSubmitted++;

        // Check win condition after instant moves
        PlayerState storage opponentCheck = playerStates[matchId][opponent];
        if (opponentCheck.health == 0) {
            _endMatch(matchId, msg.sender);
        }
    }

    function executeMove(uint256 matchId, address player, uint256 moveIndex) external {
        Match storage m = matches[matchId];
        require(m.state == MatchState.ACTIVE, "ChronosBattle: not active");

        MoveInFlight storage move = movesInFlight[matchId][player][moveIndex];
        require(!move.executed, "ChronosBattle: already executed");
        require(block.number >= move.executeBlock, "ChronosBattle: too early");

        move.executed = true;

        if (move.moveType == MoveType.SHIELD) {
            // Shield activates
            playerStates[matchId][player].shieldActive = true;
            emit ShieldActivated(matchId, player);
        } else {
            // Attack lands on opponent
            address target = player == m.player1 ? m.player2 : m.player1;
            PlayerState storage targetState = playerStates[matchId][target];

            if (targetState.shieldActive) {
                targetState.shieldActive = false;
                emit ShieldBroken(matchId, target);
            } else {
                if (targetState.health <= move.damage) {
                    targetState.health = 0;
                } else {
                    targetState.health -= move.damage;
                }
                emit MoveExecuted(matchId, player, move.damage, targetState.health);
            }

            // Check win condition
            if (targetState.health == 0) {
                _endMatch(matchId, player);
            }
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

    /**
     * @notice Cancel a WAITING match and refund the entry fee to player1.
     *         Only player1 can cancel, and only after CANCEL_TIMEOUT_BLOCKS have passed
     *         since match creation (prevents griefing / instant cancel).
     * @param matchId The match to cancel
     */
    function cancelMatch(uint256 matchId) external nonReentrant {
        Match storage m = matches[matchId];
        require(m.state == MatchState.WAITING, "ChronosBattle: not waiting");
        require(msg.sender == m.player1, "ChronosBattle: only player1 can cancel");
        require(
            block.number >= m.createdBlock + CANCEL_TIMEOUT_BLOCKS,
            "ChronosBattle: timeout not reached"
        );

        m.state = MatchState.CANCELLED;

        uint256 refund = m.prizePool;
        m.prizePool = 0;

        (bool sent, ) = m.player1.call{value: refund}("");
        require(sent, "ChronosBattle: refund failed");

        emit MatchCancelled(matchId, m.player1, refund);
    }

    // --- Helpers ---

    function _getMoveCost(MoveType moveType) internal pure returns (uint256) {
        if (moveType == MoveType.QUICK_STRIKE) return QUICK_STRIKE_COST;
        if (moveType == MoveType.POWER_BLOW) return POWER_BLOW_COST;
        if (moveType == MoveType.DEVASTATING_ATTACK) return DEVASTATING_ATTACK_COST;
        if (moveType == MoveType.SHIELD) return SHIELD_COST;
        return COUNTER_COST;
    }

    function _getMoveDelay(MoveType moveType) internal pure returns (uint256) {
        if (moveType == MoveType.POWER_BLOW) return POWER_BLOW_DELAY;
        if (moveType == MoveType.DEVASTATING_ATTACK) return DEVASTATING_ATTACK_DELAY;
        if (moveType == MoveType.SHIELD) return SHIELD_DELAY;
        return 0; // QUICK_STRIKE and COUNTER are instant
    }

    function _getMoveDamage(MoveType moveType) internal pure returns (uint256) {
        if (moveType == MoveType.POWER_BLOW) return POWER_BLOW_DAMAGE;
        if (moveType == MoveType.DEVASTATING_ATTACK) return DEVASTATING_ATTACK_DAMAGE;
        return 0; // QUICK_STRIKE handled inline, SHIELD/COUNTER do no direct damage
    }

    function _getCurrentCoins(uint256 matchId, address player) internal view returns (uint256) {
        Match storage m = matches[matchId];
        PlayerState storage ps = playerStates[matchId][player];

        uint256 blocksElapsed = block.number - m.startBlock;
        uint256 earnedCoins = blocksElapsed * COINS_PER_BLOCK;
        uint256 totalCoins = ps.coins + earnedCoins;

        return totalCoins > MAX_COINS ? MAX_COINS : totalCoins;
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

    function getCurrentCoins(uint256 matchId, address player) external view returns (uint256) {
        return _getCurrentCoins(matchId, player);
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
