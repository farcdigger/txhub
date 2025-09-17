import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt, sendTransaction } from 'wagmi/actions'
import { parseEther, encodeAbiParameters, parseAbiParameters } from 'viem'
import { config } from '../config/wagmi'
import { addXP, recordTransaction } from '../utils/xpUtils'

// Simple NFT ABI - Much cleaner and simpler
const ERC721_ABI = [
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
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_symbol",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_baseURI",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
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
    "inputs": [],
    "name": "baseURI",
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
        "name": "",
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
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// Ultra-minimal SimpleNFT bytecode - Much smaller and simpler
const ERC721_BYTECODE = "0x608060405234801561000f575f80fd5b5060405161105d38038061105d833981810160405281019061003191906101b5565b825f908161003f9190610466565b50816001908161004f9190610466565b50806002908161005f9190610466565b50505050610535565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6100c782610081565b810181811067ffffffffffffffff821117156100e6576100e5610091565b5b80604052505050565b5f6100f8610068565b905061010482826100be565b919050565b5f67ffffffffffffffff82111561012357610122610091565b5b61012c82610081565b9050602081019050919050565b8281835e5f83830152505050565b5f61015961015484610109565b6100ef565b9050828152602081018484840111156101755761017461007d565b5b610180848285610139565b509392505050565b5f82601f83011261019c5761019b610079565b5b81516101ac848260208601610147565b91505092915050565b5f805f606084860312156101cc576101cb610071565b5b5f84015167ffffffffffffffff8111156101e9576101e8610075565b5b6101f586828701610188565b935050602084015167ffffffffffffffff81111561021657610215610075565b5b61022286828701610188565b925050604084015167ffffffffffffffff81111561024357610242610075565b5b61024f86828701610188565b9150509250925092565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806102a757607f821691505b6020821081036102ba576102b9610263565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f6008830261031c7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826102e1565b61032686836102e1565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61036a6103656103608461033e565b610347565b61033e565b9050919050565b5f819050919050565b61038383610350565b61039761038f82610371565b8484546102ed565b825550505050565b5f90565b6103ab61039f565b6103b681848461037a565b505050565b5b818110156103d9576103ce5f826103a3565b6001810190506103bc565b5050565b601f82111561041e576103ef816102c0565b6103f8846102d2565b81016020851015610407578190505b61041b610413856102d2565b8301826103bb565b50505b505050565b5f82821c905092915050565b5f61043e5f1984600802610423565b1980831691505092915050565b5f610456838361042f565b9150826002028217905092915050565b61046f82610259565b67ffffffffffffffff81111561048857610487610091565b5b6104928254610290565b61049d8282856103dd565b5f60209050601f8311600181146104ce575f84156104bc578287015190505b6104c6858261044b565b86555061052d565b601f1984166104dc866102c0565b5f5b82811015610503578489015182556001820191506020850194506020810190506104de565b86831015610520578489015161051c601f89168261042f565b8355505b6001600288020188555050505b505050505050565b610b1b806105425f395ff3fe608060405234801561000f575f80fd5b5060043610610086575f3560e01c80636c0360eb116100595780636c0360eb1461012657806370a082311461014457806395d89b4114610174578063c87b56dd1461019257610086565b806306fdde031461008a57806318160ddd146100a85780636352211e146100c65780636a627842146100f6575b5f80fd5b6100926101c2565b60405161009f9190610681565b60405180910390f35b6100b061024d565b6040516100bd91906106b9565b60405180910390f35b6100e060048036038101906100db9190610700565b610253565b6040516100ed919061076a565b60405180910390f35b610110600480360381019061010b91906107ad565b610283565b60405161011d91906106b9565b60405180910390f35b61012e610357565b60405161013b9190610681565b60405180910390f35b61015e600480360381019061015991906107ad565b6103e3565b60405161016b91906106b9565b60405180910390f35b61017c6103f8565b6040516101899190610681565b60405180910390f35b6101ac60048036038101906101a79190610700565b610484565b6040516101b99190610681565b60405180910390f35b5f80546101ce90610805565b80601f01602080910402602001604051908101604052809291908181526020018280546101fa90610805565b80156102455780601f1061021c57610100808354040283529160200191610245565b820191905f5260205f20905b81548152906001019060200180831161022857829003601f168201915b505050505081565b60035481565b6004602052805f5260405f205f915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b5f8060016003546102949190610862565b90508260045f8381526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060055f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f81548092919061033290610895565b919050555060035f81548092919061034990610895565b919050555080915050919050565b6002805461036490610805565b80601f016020809104026020016040519081016040528092919081815260200182805461039090610805565b80156103db5780601f106103b2576101008083540402835291602001916103db565b820191905f5260205f20905b8154815290600101906020018083116103be57829003601f168201915b505050505081565b6005602052805f5260405f205f915090505481565b6001805461040590610805565b80601f016020809104026020016040519081016040528092919081815260200182805461043190610805565b801561047c5780601f106104535761010080835404028352916020019161047c565b820191905f5260205f20905b81548152906001019060200180831161045f57829003601f168201915b505050505081565b60606002610491836104b8565b6040516020016104a29291906109a8565b6040516020818303038152906040529050919050565b60605f82036104fe576040518060400160405280600181526020017f3000000000000000000000000000000000000000000000000000000000000000815250905061060c565b5f8290505f5b5f821461052d57808061051690610895565b915050600a8261052691906109f8565b9150610504565b5f8167ffffffffffffffff81111561054857610547610a28565b5b6040519080825280601f01601f19166020018201604052801561057a5781602001600182028036833780820191505090505b5090505b5f8514610605576001826105929190610a55565b9150600a856105a19190610a88565b60306105ad9190610862565b60f81b8183815181106105c3576105c2610ab8565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff191690815f1a905350600a856105fe91906109f8565b945061057e565b8093505050505b919050565b5f81519050919050565b5f82825260208201905092915050565b8281835e5f83830152505050565b5f601f19601f8301169050919050565b5f61065382610611565b61065d818561061b565b935061066d81856020860161062b565b61067681610639565b840191505092915050565b5f6020820190508181035f8301526106998184610649565b905092915050565b5f819050919050565b6106b3816106a1565b82525050565b5f6020820190506106cc5f8301846106aa565b92915050565b5f80fd5b6106df816106a1565b81146106e9575f80fd5b50565b5f813590506106fa816106d6565b92915050565b5f60208284031215610715576107146106d2565b5b5f610722848285016106ec565b91505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6107548261072b565b9050919050565b6107648161074a565b82525050565b5f60208201905061077d5f83018461075b565b92915050565b61078c8161074a565b8114610796575f80fd5b50565b5f813590506107a781610783565b92915050565b5f602082840312156107c2576107c16106d2565b5b5f6107cf84828501610799565b91505092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061081c57607f821691505b60208210810361082f5761082e6107d8565b5b50919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f61086c826106a1565b9150610877836106a1565b925082820190508082111561088f5761088e610835565b5b92915050565b5f61089f826106a1565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036108d1576108d0610835565b5b600182019050919050565b5f81905092915050565b5f819050815f5260205f209050919050565b5f815461090481610805565b61090e81866108dc565b9450600182165f8114610928576001811461093d5761096f565b60ff198316865281151582028601935061096f565b610946856108e6565b5f5b8381101561096757815481890152600182019150602081019050610948565b838801955050505b50505092915050565b5f61098282610611565b61098c81856108dc565b935061099c81856020860161062b565b80840191505092915050565b5f6109b382856108f8565b91506109bf8284610978565b91508190509392505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601260045260245ffd5b5f610a02826106a1565b9150610a0d836106a1565b925082610a1d57610a1c6109cb565b5b828204905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b5f610a5f826106a1565b9150610a6a836106a1565b9250828203905081811115610a8257610a81610835565b5b92915050565b5f610a92826106a1565b9150610a9d836106a1565b925082610aad57610aac6109cb565b5b828206905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52603260045260245ffdfea2646970667358221220ee57f3434238eed682d56e2acc11a382067709fee680f480d991b8a9fbc9808d64736f6c634300081a0033"

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

      // Now deploy the actual NFT contract
      console.log('🚀 Deploying NFT contract...')

      // Limit string lengths for Farcaster compatibility
      const shortName = name.substring(0, 20) // Limit to 20 chars
      const shortSymbol = symbol.substring(0, 10) // Limit to 10 chars

      console.log('📝 Using shortened parameters:', { shortName, shortSymbol })

      // Create base URI for metadata
      const baseURI = `https://api.example.com/metadata/`

      // Use sendTransaction with manual encoding for Farcaster compatibility
      const constructorData = encodeAbiParameters(
        parseAbiParameters('string _name, string _symbol, string _baseURI'),
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
            to: deployReceipt.contractAddress,
            data: mintCallData,
            value: '0x0', // Hex string with 0x prefix
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
            address: deployReceipt.contractAddress,
            abi: ERC721_ABI,
            functionName: 'mint',
            args: [address],
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
          address: deployReceipt.contractAddress,
          abi: ERC721_ABI,
          functionName: 'mint',
          args: [address],
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