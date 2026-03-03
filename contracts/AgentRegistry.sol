// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @notice ERC-8004 compatible AI Agent Registry with Identity, Reputation, and Validation
 * @dev Each AI agent is represented as an ERC-721 token with associated metadata
 */
contract AgentRegistry is ERC721Enumerable, Ownable {
    struct AgentInfo {
        string name;
        string agentURI;       // metadata URI for agent capabilities
        uint256 reputationScore;
        bool validated;
        address validator;
        uint256 registeredAt;
        uint256 lastActive;
    }

    mapping(uint256 => AgentInfo) public agents;
    mapping(address => bool) public authorizedValidators;
    uint256 private _nextTokenId;

    uint256 public constant MAX_REPUTATION = 10000; // basis points
    uint256 public constant MIN_REPUTATION_FOR_VALIDATION = 5000;

    event AgentRegistered(uint256 indexed tokenId, string name, address indexed owner);
    event ReputationUpdated(uint256 indexed tokenId, uint256 oldScore, uint256 newScore);
    event AgentValidated(uint256 indexed tokenId, address indexed validator);
    event AgentInvalidated(uint256 indexed tokenId, address indexed validator);
    event ValidatorAuthorized(address indexed validator);
    event ValidatorRevoked(address indexed validator);

    constructor() ERC721("AvaForge Agent", "AGENT") Ownable(msg.sender) {}

    // --- Identity Registry ---

    function registerAgent(
        string calldata name,
        string calldata agentURI
    ) external returns (uint256 tokenId) {
        require(bytes(name).length > 0, "AgentRegistry: empty name");

        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        agents[tokenId] = AgentInfo({
            name: name,
            agentURI: agentURI,
            reputationScore: 5000, // Start at 50%
            validated: false,
            validator: address(0),
            registeredAt: block.timestamp,
            lastActive: block.timestamp
        });

        emit AgentRegistered(tokenId, name, msg.sender);
        return tokenId;
    }

    function transferAgent(address to, uint256 tokenId) external {
        safeTransferFrom(msg.sender, to, tokenId);
    }

    function getAgent(uint256 tokenId) external view returns (AgentInfo memory) {
        require(_ownerOf(tokenId) != address(0), "AgentRegistry: agent does not exist");
        return agents[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "AgentRegistry: agent does not exist");
        return agents[tokenId].agentURI;
    }

    // --- Reputation Registry ---

    function updateReputation(uint256 tokenId, uint256 newScore) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "AgentRegistry: agent does not exist");
        require(newScore <= MAX_REPUTATION, "AgentRegistry: score too high");

        uint256 oldScore = agents[tokenId].reputationScore;
        agents[tokenId].reputationScore = newScore;
        agents[tokenId].lastActive = block.timestamp;

        emit ReputationUpdated(tokenId, oldScore, newScore);
    }

    function getReputation(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "AgentRegistry: agent does not exist");
        return agents[tokenId].reputationScore;
    }

    // --- Validation Registry ---

    function authorizeValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = true;
        emit ValidatorAuthorized(validator);
    }

    function revokeValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = false;
        emit ValidatorRevoked(validator);
    }

    function validateAgent(uint256 tokenId) external {
        require(authorizedValidators[msg.sender], "AgentRegistry: not a validator");
        require(_ownerOf(tokenId) != address(0), "AgentRegistry: agent does not exist");
        require(
            agents[tokenId].reputationScore >= MIN_REPUTATION_FOR_VALIDATION,
            "AgentRegistry: reputation too low"
        );

        agents[tokenId].validated = true;
        agents[tokenId].validator = msg.sender;

        emit AgentValidated(tokenId, msg.sender);
    }

    function invalidateAgent(uint256 tokenId) external {
        require(authorizedValidators[msg.sender], "AgentRegistry: not a validator");
        require(_ownerOf(tokenId) != address(0), "AgentRegistry: agent does not exist");

        agents[tokenId].validated = false;
        agents[tokenId].validator = address(0);

        emit AgentInvalidated(tokenId, msg.sender);
    }

    function isValidated(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "AgentRegistry: agent does not exist");
        return agents[tokenId].validated;
    }

    function getAgentsByOwner(address agentOwner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(agentOwner);
        uint256[] memory tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(agentOwner, i);
        }
        return tokenIds;
    }
}
