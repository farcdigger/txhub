import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt, sendTransaction } from 'wagmi/actions'
import { parseEther, encodeAbiParameters, parseAbiParameters } from 'viem'
import { config } from '../config/wagmi'
import { addXP, recordTransaction } from '../utils/xpUtils'

// ERC721 ABI for NFT minting
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

// Minimal ERC721 bytecode for NFT minting
const ERC721_BYTECODE = "0x608060405234801561001057600080fd5b506040516108a73803806108a7833981810160405281019061003291906101a6565b82600390816100419190610275565b5080600490816100519190610275565b5061006a33670de0b6b3a764000084610067919061034b565b610070565b5050506103a2565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036100df5760006040517fec442f050000000000000000000000000000000000000000000000000000000081526004016100d691906103e5565b60405180910390fd5b6100eb600083836100ef565b5050565b505050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101558261010c565b810181811067ffffffffffffffff821117156101745761017361011d565b5b80604052505050565b60006101876100f4565b9050610193828261014c565b919050565b600067ffffffffffffffff8211156101b3576101b261011d565b5b6101bc8261010c565b9050602081019050919050565b60005b838110156101e75780820151818401526020810190506101cc565b60008484015250505050565b600061020661020184610198565b61017d565b90508281526020810184848401111561022257610221610107565b5b61022d8482856101c9565b509392505050565b600082601f83011261024a57610249610102565b5b815161025a8482602086016101f3565b91505092915050565b6000819050919050565b61027681610263565b811461028157600080fd5b50565b6000815190506102938161026d565b92915050565b6000806000606084860312156102b2576102b16100fd565b5b600084015167ffffffffffffffff8111156102d0576102cf610101565b5b6102dc86828701610235565b935050602084015167ffffffffffffffff8111156102fd576102fc610101565b5b61030986828701610235565b925050604061031a86828701610284565b9150509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061035d57607f821691505b6020821081036103705761036f610320565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103d87fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8261039b565b6103e2868361039b565b95508019841693508086168417925050509392505050565b6000819050919050565b600061041f61041a61041584610263565b6103fa565b610263565b9050919050565b6000819050919050565b61043983610404565b61044d61044582610426565b8484546103a8565b825550505050565b600090565b610462610455565b61046d818484610430565b505050565b6000602082019050818103600083015261048c818461045a565b905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006104ce82610263565b91506104d983610263565b92508282026104e781610263565b915082820484148315176104fe576104fd610494565b5b5092915050565b6101ba8061051460003980610168fe"

export const useMintNFT = () => {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const mintNFT = async (name, symbol, description, imageFile) => {
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
      currentGasPrice = 1000000n // 0.001 gwei
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

      // Now deploy the NFT contract
      console.log('🚀 Deploying NFT contract...')

      // Limit string lengths for Farcaster compatibility
      const shortName = name.substring(0, 20) // Limit to 20 chars
      const shortSymbol = symbol.substring(0, 10) // Limit to 10 chars
      const baseURI = `https://api.example.com/metadata/` // Placeholder base URI

      console.log('📝 Using shortened parameters:', { shortName, shortSymbol, baseURI })

      // Use sendTransaction with manual encoding for Farcaster compatibility
      const constructorData = encodeAbiParameters(
        parseAbiParameters('string name, string symbol, string baseURI'),
        [shortName, shortSymbol, baseURI]
      )

      const deployData = ERC721_BYTECODE + constructorData.slice(2)

      // Check data size for Farcaster compatibility
      const dataSizeKB = (deployData.length - 2) / 2 / 1024 // Convert hex to bytes, then to KB
      console.log('🔍 Deploy data size:', dataSizeKB.toFixed(2), 'KB')

      if (dataSizeKB > 50) {
        throw new Error(`Deploy data too large: ${dataSizeKB.toFixed(2)}KB. Farcaster limit: 50KB`)
      }

      let deployTxHash
      if (isFarcasterWallet) {
        try {
          // Use direct ethereum provider for contract deployment with proper EIP-1193 format
          console.log('🔧 Using direct ethereum provider for contract deployment')

          // Debug: Log the exact RPC call being made
          const deployTxParams = {
            from: address,
            data: deployData, // Already has 0x prefix
            value: '0x0', // Hex string with 0x prefix
            gas: '0x13880', // 80,000 gas limit (0x13880 in hex)
            gasPrice: '0x' + currentGasPrice.toString(16), // Legacy gas price
            // NO 'to' field for contract deployment - this prevents eth_call issues
            // NO type field - use legacy transaction to avoid EIP-1559 issues
          }
          console.log('🔍 Deploy transaction params:', JSON.stringify(deployTxParams, null, 2))
          console.log('🔍 Deploy data length:', deployData.length, 'bytes')

          const deployTx = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [deployTxParams]
          })
          deployTxHash = deployTx
          console.log('✅ Direct ethereum provider contract deployment successful:', deployTxHash)
        } catch (ethereumError) {
          console.error('❌ Direct ethereum provider failed, falling back to regular method:', ethereumError)
          // Fallback to regular method if direct ethereum provider fails
          deployTxHash = await sendTransaction(config, {
            data: deployData,
            value: 0n, // BigInt
            gas: 80000n, // Gas limit for contract deployment
            gasPrice: currentGasPrice, // Legacy gas price
            type: 'legacy', // Use legacy transaction to avoid EIP-1559 issues
            // @ts-expect-error - viem/wagmi forward eder
            accessList: [], // Disable access list creation
          })
        }
      } else {
        // Use regular sendTransaction for external wallets
        deployTxHash = await sendTransaction(config, {
          data: deployData,
          value: 0n, // BigInt
          gas: 80000n, // Gas limit for contract deployment
          gasPrice: currentGasPrice, // Legacy gas price
          type: 'legacy', // Use legacy transaction to avoid EIP-1559 issues
          // @ts-expect-error - viem/wagmi forward eder
          accessList: [], // Disable access list creation
        })
      }

      console.log('✅ Deploy transaction sent:', deployTxHash)

      // Wait for deploy confirmation
      const deployReceipt = await waitForTransactionReceipt(config, {
        hash: deployTxHash,
        confirmations: 1,
      })

      console.log('✅ NFT contract deployed successfully!')
      console.log('📄 Contract Address:', deployReceipt.contractAddress)

      // Now mint the NFT
      console.log('🎨 Minting NFT...')

      let mintTxHash
      if (isFarcasterWallet) {
        try {
          // Use direct ethereum provider for minting
          console.log('🔧 Using direct ethereum provider for NFT minting')

          const mintTxParams = {
            from: address,
            to: deployReceipt.contractAddress,
            data: '0x40c10f19000000000000000000000000' + address.slice(2), // mint(address) function call
            gas: '0x7530', // 30,000 gas limit for minting
            gasPrice: '0x' + currentGasPrice.toString(16), // Legacy gas price
          }
          console.log('🔍 Mint transaction params:', JSON.stringify(mintTxParams, null, 2))

          const mintTx = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [mintTxParams]
          })
          mintTxHash = mintTx
          console.log('✅ Direct ethereum provider NFT minting successful:', mintTxHash)
        } catch (ethereumError) {
          console.error('❌ Direct ethereum provider failed, falling back to regular method:', ethereumError)
          // Fallback to regular method
          mintTxHash = await sendTransaction(config, {
            to: deployReceipt.contractAddress,
            data: '0x40c10f19000000000000000000000000' + address.slice(2), // mint(address) function call
            gas: 30000n, // Gas limit for minting
            gasPrice: currentGasPrice, // Legacy gas price
            type: 'legacy', // Use legacy transaction to avoid EIP-1559 issues
            // @ts-expect-error - viem/wagmi forward eder
            accessList: [], // Disable access list creation
          })
        }
      } else {
        // Use regular sendTransaction for external wallets
        mintTxHash = await sendTransaction(config, {
          to: deployReceipt.contractAddress,
          data: '0x40c10f19000000000000000000000000' + address.slice(2), // mint(address) function call
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

      // Award XP for successful NFT minting
      try {
        console.log('🎉 Awarding 100 XP for NFT minting!')
        await addXP(address, 100, 'NFT Minting')

        // Record the transaction for tracking
        await recordTransaction({
          wallet_address: address,
          game_type: 'NFT Minting',
          tx_hash: mintTxHash,
          xp_earned: 100,
          result: 'success',
          contract_address: deployReceipt.contractAddress,
          nft_name: shortName,
          nft_symbol: shortSymbol,
          nft_description: description || ''
        })

        console.log('✅ XP awarded and transaction recorded!')
      } catch (xpError) {
        console.error('⚠️ Failed to award XP:', xpError)
        // Don't throw here, minting was successful
      }

      setSuccessMessage(`✅ NFT "${shortName}" (${shortSymbol}) minted successfully! Contract: ${deployReceipt.contractAddress}`)

      return {
        txHash: mintTxHash,
        contractAddress: deployReceipt.contractAddress,
        feeTxHash,
        fee: '0.000001 ETH',
        feeWallet,
        xpEarned: 100,
        status: 'NFT minted successfully! +100 XP earned!'
      }
    } catch (err) {
      console.error('❌ NFT minting failed:', err)
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
