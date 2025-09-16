// Base Network Configuration
export const BASE_CONFIG = {
  chainId: 8453, // Base mainnet
  chainName: 'Base',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://mainnet.base.org',
    'https://base-mainnet.g.alchemy.com/v2/demo',
    'https://base-mainnet.public.blastapi.io',
  ],
  blockExplorerUrls: ['https://basescan.org'],
  iconUrls: ['https://base.org/favicon.ico'],
}

// Base Testnet Configuration (for development)
export const BASE_TESTNET_CONFIG = {
  chainId: 84532, // Base Sepolia testnet
  chainName: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://sepolia.base.org',
    'https://base-sepolia.g.alchemy.com/v2/demo',
  ],
  blockExplorerUrls: ['https://sepolia.basescan.org'],
  iconUrls: ['https://base.org/favicon.ico'],
}

// Contract addresses for our games (Base Mainnet - DEPLOYED!)
export const CONTRACT_ADDRESSES = {
  // Mainnet addresses (DEPLOYED!)
  GM_GAME: '0x71a625487DC88fa1Be54EC8BD96E240aCdAF8Fb0',
  GN_GAME: '0x9E54449DD4c042279aA454710481Cf33E15d8cb7',
  FLIP_GAME: '0xc79F867244dceB1245869Cd1506f3118875B197c',
  LUCKY_NUMBER: '0x642b3A72DEdc42921555401a37CE05d40bDEa5AF',
  DICE_ROLL: '0xff48b92CbCFc1679Aa16a1D8a712A5d489220D0B',
  TOKEN_CONTRACT: '0xB2b2c587E51175a2aE4713d8Ea68A934a8527a4b',
  
  // Testnet addresses (to be deployed)
  GM_GAME_TESTNET: '0x0000000000000000000000000000000000000000',
  GN_GAME_TESTNET: '0x0000000000000000000000000000000000000000',
  FLIP_GAME_TESTNET: '0x0000000000000000000000000000000000000000',
  LUCKY_NUMBER_TESTNET: '0x0000000000000000000000000000000000000000',
  DICE_ROLL_TESTNET: '0x0000000000000000000000000000000000000000',
  TOKEN_CONTRACT_TESTNET: '0x0000000000000000000000000000000000000000',
}

// Game configurations
export const GAME_CONFIG = {
  GM_REWARD: '1000000000000000000', // 1 token in wei
  GN_REWARD: '1000000000000000000', // 1 token in wei
  FLIP_MIN_BET: '100000000000000', // 0.0001 ETH in wei
  FLIP_MAX_BET: '10000000000000000', // 0.01 ETH in wei
  LUCKY_NUMBER_REWARD: '2000000000000000000', // 2 tokens in wei
  DICE_ROLL_REWARD: '3000000000000000000', // 3 tokens in wei
  GAME_FEE: '5000000000000', // 0.000005 ETH in wei
}

// Gas configurations
export const GAS_CONFIG = {
  GAS_LIMIT: '200000',
  GAS_PRICE: '2000000000', // 2 gwei
  MAX_FEE_PER_GAS: '3000000000', // 3 gwei
  MAX_PRIORITY_FEE_PER_GAS: '2000000000', // 2 gwei
}

// Use testnet for development, mainnet for production
export const IS_TESTNET = false // Force mainnet for deployed contracts

export const getCurrentConfig = () => {
  return IS_TESTNET ? BASE_TESTNET_CONFIG : BASE_CONFIG
}

export const getContractAddress = (contractName) => {
  const suffix = IS_TESTNET ? '_TESTNET' : ''
  return CONTRACT_ADDRESSES[`${contractName}${suffix}`]
}
