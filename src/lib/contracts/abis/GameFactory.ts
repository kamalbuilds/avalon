export const GameFactoryABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "gameAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "GameCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "GameRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "maxPlayers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "entryFee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roundDuration",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "vrfEnabled",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "stablecoinEnabled",
            "type": "bool"
          }
        ],
        "indexed": false,
        "internalType": "struct GameFactory.GameConfig",
        "name": "config",
        "type": "tuple"
      }
    ],
    "name": "GameUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "maxPlayers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "entryFee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roundDuration",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "vrfEnabled",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "stablecoinEnabled",
            "type": "bool"
          }
        ],
        "internalType": "struct GameFactory.GameConfig",
        "name": "config",
        "type": "tuple"
      }
    ],
    "name": "createGame",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "creatorGames",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gameCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "games",
    "outputs": [
      {
        "internalType": "address",
        "name": "gameAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "maxPlayers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "entryFee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roundDuration",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "vrfEnabled",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "stablecoinEnabled",
            "type": "bool"
          }
        ],
        "internalType": "struct GameFactory.GameConfig",
        "name": "config",
        "type": "tuple"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "active",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveGames",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "getCreatorGames",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "getGame",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "gameAddress",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "maxPlayers",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "entryFee",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "roundDuration",
                "type": "uint256"
              },
              {
                "internalType": "bool",
                "name": "vrfEnabled",
                "type": "bool"
              },
              {
                "internalType": "bool",
                "name": "stablecoinEnabled",
                "type": "bool"
              }
            ],
            "internalType": "struct GameFactory.GameConfig",
            "name": "config",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct GameFactory.GameInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      }
    ],
    "name": "removeGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "gameAddress",
        "type": "address"
      }
    ],
    "name": "setGameAddress",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "gameId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "maxPlayers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "entryFee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roundDuration",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "vrfEnabled",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "stablecoinEnabled",
            "type": "bool"
          }
        ],
        "internalType": "struct GameFactory.GameConfig",
        "name": "config",
        "type": "tuple"
      }
    ],
    "name": "updateGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
