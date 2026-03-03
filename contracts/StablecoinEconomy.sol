// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StablecoinEconomy
 * @notice Game economy with USDC/USDT for in-game purchases, entry fees, and prize pools
 */
contract StablecoinEconomy is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct PrizePool {
        uint256 totalAmount;
        uint256 distributed;
        bool finalized;
        mapping(address => uint256) claims;
    }

    struct RevenueSplit {
        uint16 platformFeeBps;   // basis points for platform
        uint16 creatorFeeBps;    // basis points for game creator
        uint16 prizePoolBps;     // basis points for prize pool
    }

    // Accepted stablecoins
    mapping(address => bool) public acceptedTokens;
    address[] public tokenList;

    // Game economies
    mapping(uint256 => address) public gameCreators;
    mapping(uint256 => RevenueSplit) public revenueSplits;
    mapping(uint256 => mapping(address => uint256)) public prizePools; // gameId => token => amount
    mapping(uint256 => mapping(address => bool)) public hasEnteredGame; // gameId => player => entered

    // Platform treasury
    address public treasury;
    mapping(address => uint256) public platformRevenue;

    // Default revenue split: 5% platform, 10% creator, 85% prize pool
    RevenueSplit public defaultSplit;

    event TokenAccepted(address indexed token);
    event TokenRemoved(address indexed token);
    event EntryFeePaid(uint256 indexed gameId, address indexed player, address token, uint256 amount);
    event PurchaseMade(uint256 indexed gameId, address indexed player, address token, uint256 amount, string itemId);
    event PrizeDistributed(uint256 indexed gameId, address indexed winner, address token, uint256 amount);
    event RevenueWithdrawn(address indexed token, uint256 amount);
    event RevenueSplitUpdated(uint256 indexed gameId, RevenueSplit split);

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "StablecoinEconomy: zero treasury");
        treasury = _treasury;

        defaultSplit = RevenueSplit({
            platformFeeBps: 500,  // 5%
            creatorFeeBps: 1000,  // 10%
            prizePoolBps: 8500    // 85%
        });
    }

    // --- Token Management ---

    function acceptToken(address token) external onlyOwner {
        require(token != address(0), "StablecoinEconomy: zero address");
        require(!acceptedTokens[token], "StablecoinEconomy: already accepted");

        acceptedTokens[token] = true;
        tokenList.push(token);
        emit TokenAccepted(token);
    }

    function removeToken(address token) external onlyOwner {
        require(acceptedTokens[token], "StablecoinEconomy: not accepted");
        acceptedTokens[token] = false;
        emit TokenRemoved(token);
    }

    // --- Game Setup ---

    function registerGame(uint256 gameId, address creator) external onlyOwner {
        require(creator != address(0), "StablecoinEconomy: zero creator");
        gameCreators[gameId] = creator;
    }

    function setRevenueSplit(uint256 gameId, RevenueSplit calldata split) external {
        require(
            msg.sender == gameCreators[gameId] || msg.sender == owner(),
            "StablecoinEconomy: not authorized"
        );
        require(
            split.platformFeeBps + split.creatorFeeBps + split.prizePoolBps == 10000,
            "StablecoinEconomy: must sum to 10000"
        );

        revenueSplits[gameId] = split;
        emit RevenueSplitUpdated(gameId, split);
    }

    // --- Entry Fees ---

    function payEntryFee(
        uint256 gameId,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(acceptedTokens[token], "StablecoinEconomy: token not accepted");
        require(!hasEnteredGame[gameId][msg.sender], "StablecoinEconomy: already entered");
        require(amount > 0, "StablecoinEconomy: zero amount");

        hasEnteredGame[gameId][msg.sender] = true;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        RevenueSplit memory split = revenueSplits[gameId].platformFeeBps > 0
            ? revenueSplits[gameId]
            : defaultSplit;

        uint256 platformFee = (amount * split.platformFeeBps) / 10000;
        uint256 creatorFee = (amount * split.creatorFeeBps) / 10000;
        uint256 prizeAmount = amount - platformFee - creatorFee;

        platformRevenue[token] += platformFee;

        if (gameCreators[gameId] != address(0)) {
            IERC20(token).safeTransfer(gameCreators[gameId], creatorFee);
        } else {
            platformRevenue[token] += creatorFee;
        }

        prizePools[gameId][token] += prizeAmount;

        emit EntryFeePaid(gameId, msg.sender, token, amount);
    }

    // --- In-Game Purchases ---

    function purchase(
        uint256 gameId,
        address token,
        uint256 amount,
        string calldata itemId
    ) external nonReentrant {
        require(acceptedTokens[token], "StablecoinEconomy: token not accepted");
        require(amount > 0, "StablecoinEconomy: zero amount");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        RevenueSplit memory split = revenueSplits[gameId].platformFeeBps > 0
            ? revenueSplits[gameId]
            : defaultSplit;

        uint256 platformFee = (amount * split.platformFeeBps) / 10000;
        uint256 creatorFee = amount - platformFee;

        platformRevenue[token] += platformFee;

        if (gameCreators[gameId] != address(0)) {
            IERC20(token).safeTransfer(gameCreators[gameId], creatorFee);
        } else {
            platformRevenue[token] += creatorFee;
        }

        emit PurchaseMade(gameId, msg.sender, token, amount, itemId);
    }

    // --- Prize Distribution ---

    function distributePrize(
        uint256 gameId,
        address token,
        address winner,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(acceptedTokens[token], "StablecoinEconomy: token not accepted");
        require(prizePools[gameId][token] >= amount, "StablecoinEconomy: insufficient pool");

        prizePools[gameId][token] -= amount;
        IERC20(token).safeTransfer(winner, amount);

        emit PrizeDistributed(gameId, winner, token, amount);
    }

    // --- Revenue Withdrawal ---

    function withdrawRevenue(address token) external onlyOwner nonReentrant {
        uint256 amount = platformRevenue[token];
        require(amount > 0, "StablecoinEconomy: no revenue");

        platformRevenue[token] = 0;
        IERC20(token).safeTransfer(treasury, amount);

        emit RevenueWithdrawn(token, amount);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "StablecoinEconomy: zero treasury");
        treasury = _treasury;
    }

    // --- Views ---

    function getPrizePool(uint256 gameId, address token) external view returns (uint256) {
        return prizePools[gameId][token];
    }

    function getAcceptedTokens() external view returns (address[] memory) {
        return tokenList;
    }
}
