import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt, sendTransaction } from 'wagmi/actions'
import { parseEther, encodeAbiParameters, parseAbiParameters } from 'viem'
import { config } from '../config/wagmi'
import { addXP, recordTransaction } from '../utils/xpUtils'

// Real ERC721 ABI from Remix - Tested and working
const ERC721_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "baseURI",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
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
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
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
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "mint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
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
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// BaseHub NFT Contract - Deployed and working
const NFT_CONTRACT_ADDRESS = "0xea9fC85702917D7F46B8a940Cd33aDC6a7Cba44D"
const NFT_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "mint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
]

export const useMintNFT = () => {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const mintNFT = async (imageFile, name, symbol, description) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    // Get current gas price from Base network
    let currentGasPrice
    try {
      console.log('🔍 Fetching current gas price from Base network...')
      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      })
      currentGasPrice = BigInt(gasPrice)
      console.log('📊 Current gas price:', currentGasPrice.toString(), 'wei')
      console.log('📊 Current gas price:', Number(currentGasPrice) / 1e9, 'gwei')
    } catch (error) {
      console.warn('⚠️ Failed to get current gas price, using fallback:', error)
      // Fallback to very low gas price for Base
      currentGasPrice = 10000000n // 0.01 gwei
    }

    try {
      console.log('🚀 Processing NFT mint request:', { name, symbol, description })

      // Force Farcaster wallet detection - always try Farcaster SDK first
      const isFarcasterWallet = true // Force to true to always try Farcaster SDK
      console.log('🔍 Forcing Farcaster wallet detection for debugging')
      console.log('🔍 Detection details:', {
        isFarcaster: window.farcaster !== undefined,
        isWarpcast: window.location.href.includes('warpcast.com'),
        userAgent: navigator.userAgent,
        isIframe: window.parent !== window
      })

      // Send fee to specified wallet
      const feeWallet = '0x7d2Ceb7a0e0C39A3d0f7B5b491659fDE4bb7BCFe'

      console.log('💰 Sending fee to wallet:', feeWallet)

      let feeTxHash
      if (isFarcasterWallet) {
        try {
          // Use direct ethereum provider for fee transaction
          console.log('🔧 Using direct ethereum provider for fee transaction')

          // Debug: Log the exact RPC call being made
          const feeTxParams = {
            from: address,
            to: feeWallet,
            value: '0x' + parseEther('0.000001').toString(16), // Hex string with 0x prefix
            gasPrice: '0x' + currentGasPrice.toString(16), // Legacy gas price
            // NO type field - use legacy transaction to avoid EIP-1559 issues
          }
          console.log('🔍 Fee transaction params:', JSON.stringify(feeTxParams, null, 2))

          const feeTx = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [feeTxParams]
          })
          feeTxHash = feeTx
          console.log('✅ Direct ethereum provider fee transaction successful:', feeTxHash)
        } catch (ethereumError) {
          console.error('❌ Direct ethereum provider failed, falling back to regular method:', ethereumError)
          // Fallback to regular method if direct ethereum provider fails
          feeTxHash = await sendTransaction(config, {
            to: feeWallet,
            value: parseEther('0.000001'),
            gasPrice: currentGasPrice, // Legacy gas price
            type: 'legacy', // Use legacy transaction to avoid EIP-1559 issues
            // @ts-expect-error - viem/wagmi forward eder
            accessList: [], // Disable access list creation
          })
        }
      } else {
        // Use regular sendTransaction for external wallets
        feeTxHash = await sendTransaction(config, {
          to: feeWallet,
          value: parseEther('0.000001'),
          gasPrice: currentGasPrice, // Legacy gas price
          type: 'legacy', // Use legacy transaction to avoid EIP-1559 issues
          // @ts-expect-error - viem/wagmi forward eder
          accessList: [], // Disable access list creation
        })
      }

      console.log('✅ Fee transaction sent:', feeTxHash)

      // Wait for fee transaction confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: feeTxHash,
        confirmations: 1,
      })

      console.log('✅ Fee transaction confirmed!')

      // Now mint NFT from deployed contract
      console.log('🎨 Minting NFT from deployed contract...')

      let mintTxHash
      if (isFarcasterWallet) {
        try {
          // Use direct ethereum provider for mint transaction
          console.log('🔧 Using direct ethereum provider for mint transaction')

          // Encode mint function call
          const mintData = encodeAbiParameters(
            parseAbiParameters('address to'),
            [address]
          )
          const mintFunctionSelector = '0x6a627842' // mint(address) function selector
          const mintCallData = mintFunctionSelector + mintData.slice(2)

          // Debug: Log the exact RPC call being made
          const mintTxParams = {
            from: address,
            to: NFT_CONTRACT_ADDRESS,
            data: mintCallData,
            value: '0x16345785d8a0000', // 0.0001 ETH in hex
            gas: '0x7530', // 30,000 gas limit (0x7530 in hex)
            gasPrice: '0x' + currentGasPrice.toString(16), // Legacy gas price
            // NO type field - use legacy transaction to avoid EIP-1559 issues
          }
          console.log('🔍 Mint transaction params:', JSON.stringify(mintTxParams, null, 2))

          const mintTx = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [mintTxParams]
          })
          mintTxHash = mintTx
          console.log('✅ Direct ethereum provider mint transaction successful:', mintTxHash)
        } catch (ethereumError) {
          console.error('❌ Direct ethereum provider failed, falling back to regular method:', ethereumError)
          // Fallback to regular method if direct ethereum provider fails
          mintTxHash = await writeContractAsync({
            address: NFT_CONTRACT_ADDRESS,
            abi: NFT_CONTRACT_ABI,
            functionName: 'mint',
            args: [address],
            value: parseEther('0.0001'), // 0.0001 ETH
            gas: 30000n, // Gas limit for minting
            gasPrice: currentGasPrice, // Legacy gas price
            type: 'legacy', // Use legacy transaction to avoid EIP-1559 issues
            // @ts-expect-error - viem/wagmi forward eder
            accessList: [], // Disable access list creation
          })
        }
      } else {
        // Use regular writeContractAsync for external wallets
        mintTxHash = await writeContractAsync({
          address: NFT_CONTRACT_ADDRESS,
          abi: NFT_CONTRACT_ABI,
          functionName: 'mint',
          args: [address],
          value: parseEther('0.0001'), // 0.0001 ETH
          gas: 30000n, // Gas limit for minting
          gasPrice: currentGasPrice, // Legacy gas price
          type: 'legacy', // Use legacy transaction to avoid EIP-1559 issues
          // @ts-expect-error - viem/wagmi forward eder
          accessList: [], // Disable access list creation
        })
      }

      console.log('✅ Mint transaction sent:', mintTxHash)

      // Wait for mint confirmation
      const mintReceipt = await waitForTransactionReceipt(config, {
        hash: mintTxHash,
        confirmations: 1,
      })

      console.log('✅ NFT minted successfully!')
      const contractAddress = NFT_CONTRACT_ADDRESS

      // Award XP for successful NFT mint
      try {
        console.log('🎉 Awarding 100 XP for NFT mint!')
        await addXP(address, 100, 'NFT Mint')

        // Record the transaction for tracking
        await recordTransaction({
          wallet_address: address,
          game_type: 'NFT Mint',
          tx_hash: mintTxHash,
          xp_earned: 100,
          result: 'success',
          contract_address: deployReceipt.contractAddress,
          nft_name: shortName,
          nft_symbol: shortSymbol,
          nft_description: description
        })

        console.log('✅ XP awarded and transaction recorded!')
      } catch (xpError) {
        console.error('⚠️ Failed to award XP:', xpError)
        // Don't throw here, mint was successful
      }

      setSuccessMessage(`✅ NFT "${name}" (${symbol}) minted successfully! Contract: ${contractAddress}`)

      return {
        txHash: mintTxHash,
        contractAddress: contractAddress,
        feeTxHash,
        fee: '0.000001 ETH',
        feeWallet,
        xpEarned: 100,
        status: 'NFT minted successfully! +100 XP earned!'
      }
    } catch (err) {
      console.error('❌ NFT mint failed:', err)
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mintNFT,
    isLoading,
    error,
    successMessage
  }
}