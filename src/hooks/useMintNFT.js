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

// Simple ERC721 bytecode - Deployable and working
const ERC721_BYTECODE = "0x608060405234801561000f575f80fd5b5060405161241a38038061241a833981810160405281019061003191906101b9565b8282815f9081610041919061046a565b508060019081610051919061046a565b5050508060079081610063919061046a565b50505050610539565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6100cb82610085565b810181811067ffffffffffffffff821117156100ea576100e9610095565b5b80604052505050565b5f6100fc61006c565b905061010882826100c2565b919050565b5f67ffffffffffffffff82111561012757610126610095565b5b61013082610085565b9050602081019050919050565b8281835e5f83830152505050565b5f61015d6101588461010d565b6100f3565b90508281526020810184848401111561017957610178610081565b5b61018484828561013d565b509392505050565b5f82601f8301126101a05761019f61007d565b5b81516101b084826020860161014b565b91505092915050565b5f805f606084860312156101d0576101cf610075565b5b5f84015167ffffffffffffffff8111156101ed576101ec610079565b5b6101f98682870161018c565b935050602084015167ffffffffffffffff81111561021a57610219610079565b5b6102268682870161018c565b925050604084015167ffffffffffffffff81111561024757610246610079565b5b6102538682870161018c565b9150509250925092565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806102ab57607f821691505b6020821081036102be576102bd610267565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026103207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826102e5565b61032a86836102e5565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61036e61036961036484610342565b61034b565b610342565b9050919050565b5f819050919050565b61038783610354565b61039b61039382610375565b8484546102f1565b825550505050565b5f90565b6103af6103a3565b6103ba81848461037e565b505050565b5b818110156103dd576103d25f826103a7565b6001810190506103c0565b5050565b601f821115610422576103f3816102c4565b6103fc846102d6565b8101602085101561040b578190505b61041f610417856102d6565b8301826103bf565b50505b505050565b5f82821c905092915050565b5f6104425f1984600802610427565b1980831691505092915050565b5f61045a8383610433565b9150826002028217905092915050565b6104738261025d565b67ffffffffffffffff81111561048c5761048b610095565b5b6104968254610294565b6104a18282856103e1565b5f60209050601f8311600181146104d2575f84156104c0578287015190505b6104ca858261044f565b865550610531565b601f1984166104e0866102c4565b5f5b82811015610507578489015182556001820191506020850194506020810190506104e2565b868310156105245784890151610520601f891682610433565b8355505b6001600288020188555050505b505050505050565b611ed4806105465f395ff3fe608060405234801561000f575f80fd5b50600436106100f3575f3560e01c80636352211e11610095578063a22cb46511610064578063a22cb46514610295578063b88d4fde146102b1578063c87b56dd146102cd578063e985e9c5146102fd576100f3565b80636352211e146101e75780636a6278421461021757806370a082311461024757806395d89b4114610277576100f3565b8063095ea7b3116100d1578063095ea7b31461017557806318160ddd1461019157806323b872dd146101af57806342842e0e146101cb576100f3565b806301ffc9a7146100f757806306fdde0314610127578063081812fc14610145575b5f80fd5b610111600480360381019061010c91906116d8565b61032d565b60405161011e919061171d565b60405180910390f35b61012f61040e565b60405161013c91906117a6565b60405180910390f35b61015f600480360381019061015a91906117f9565b61049d565b60405161016c9190611863565b60405180910390f35b61018f600480360381019061018a91906118a6565b6104b8565b005b6101996104ce565b6040516101a691906118f3565b60405180910390f35b6101c960048036038101906101c4919061190c565b6104d7565b005b6101e560048036038101906101e0919061190c565b6105d6565b005b61020160048036038101906101fc91906117f9565b6105f5565b60405161020e9190611863565b60405180910390f35b610231600480360381019061022c919061195c565b610606565b60405161023e91906118f3565b60405180910390f35b610261600480360381019061025c919061195c565b610643565b60405161026e91906118f3565b60405180910390f35b61027f6106f9565b60405161028c91906117a6565b60405180910390f35b6102af60048036038101906102aa91906119b1565b610789565b005b6102cb60048036038101906102c69190611b1b565b61079f565b005b6102e760048036038101906102e291906117f9565b6107c4565b6040516102f491906117a6565b60405180910390f35b61031760048036038101906103129190611b9b565b61082a565b604051610324919061171d565b60405180910390f35b5f7f80ac58cd000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614806103f757507f5b5e139f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b806104075750610406826108b8565b5b9050919050565b60605f805461041c90611c06565b80601f016020809104026020016040519081016040528092919081815260200182805461044890611c06565b80156104935780601f1061046a57610100808354040283529160200191610493565b820191905f5260205f20905b81548152906001019060200180831161047657829003601f168201915b5050505050905090565b5f6104a782610921565b506104b1826109a7565b9050919050565b6104ca82826104c56109e0565b6109e7565b5050565b5f600654905090565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610547575f6040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161053e9190611863565b60405180910390fd5b5f61055a83836105556109e0565b6109f9565b90508373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146105d0578382826040517f64283d7b0000000000000000000000000000000000000000000000000000000081526004016105c793929190611c36565b60405180910390fd5b50505050565b6105f083838360405180602001604052805f81525061079f565b505050565b5f6105ff82610921565b9050919050565b5f8060016006546106179190611c98565b90508260045f8381526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060055f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f81548092919061033290611895565b919050555060035f81548092919061034990611895565b919050555080915050919050565b60028054610364906111c06565b80601f016020809104026020016040519081016040528092919081815260200182805461039090611c06565b80156103db5780601f106103b2576101008083540402835291602001916103db565b820191905f5260205f20905b8154815290600101906020018083116103be57829003601f168201915b505050505081565b6005602052805f5260405f205f915090505481565b60018054610405906111c06565b80601f016020809104026020016040519081016040528092919081815260200182805461043190611c06565b801561047c5780601f106104535761010080835404028352916020019161047c565b820191905f5260205f20905b81548152906001019060200180831161045f57829003601f168201915b505050505081565b60606002610491836104b8565b6040516020016104a29291906109a8565b6040516020818303038152906040529050919050565b60605f82036104fe576040518060400160405280600181526020017f3000000000000000000000000000000000000000000000000000000000000000815250905061060c565b5f8290505f5b5f821461052d57808061051690611895565b915050600a8261052691906109f8565b9150610504565b5f8167ffffffffffffffff81111561054857610547610a28565b5b6040519080825280601f01601f19166020018201604052801561057a5781602001600182028036833780820191505090505b5090505b5f8514610605576001826105929190610a55565b9150600a856105a19190610a88565b60306105ad9190610862565b60f81b8183815181106105c3576105c2610ab8565b5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff191690815f1a905350600a856105fe91906109f8565b945061057e565b8093505050505b919050565b5f81519050919050565b5f82825260208201905092915050565b8281835e5f83830152505050565b5f601f19601f8301169050919050565b5f61065382610611565b61065d818561061b565b935061066d81856020860161062b565b61067681610639565b840191505092915050565b5f6020820190508181035f8301526106998184610649565b905092915050565b5f819050919050565b6106b3816106a1565b82525050565b5f6020820190506106cc5f8301846106aa565b92915050565b5f80fd5b6106df816106a1565b81146106e9575f80fd5b50565b5f813590506106fa816106d6565b92915050565b5f60208284031215610715576107146106d2565b5b5f610722848285016106ec565b91505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6107548261072b565b9050919050565b6107648161074a565b82525050565b5f60208201905061077d5f83018461075b565b92915050565b61078c8161074a565b8114610796575f80fd5b50565b5f813590506107a781610783565b92915050565b5f602082840312156107c2576107c16106d2565b5b5f6107cf84828501610799565b91505092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061081c57607f821691505b60208210810361082f5761082e6107d8565b5b50919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f61086c826106a1565b9150610877836106a1565b925082820190508082111561088f5761088e610835565b5b92915050565b5f61089f826106a1565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036108d1576108d0610835565b5b600182019050919050565b5f81905092915050565b5f819050815f5260205f209050919050565b5f815461090481610805565b61090e81866108dc565b9450600182165f8114610928576001811461093d5761096f565b60ff198316865281151582028601935061096f565b610946856108e6565b5f5b8381101561096757815481890152600182019150602081019050610948565b838801955050505b50505092915050565b5f61098282610611565b61098c81856108dc565b935061099c81856020860161062b565b80840191505092915050565b5f6109b382856108f8565b91506109bf8284610978565b91508190509392505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601260045260245ffd5b5f610a02826106a1565b9150610a0d836106a1565b925082610a1d57610a1c6109cb565b5b828204905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b5f610a5f826106a1565b9150610a6a836106a1565b9250828203905081811115610a8257610a81610835565b5b92915050565b5f610a92826106a1565b9150610a9d836106a1565b925082610aad57610aac6109cb565b5b828206905092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52603260045260245ffdfea2646970667358221220f517e1c009b833544de5e7c2eabf8302a7171f1e0c458b6e08ffc187899b8c3b64736f6c634300081a0033"

export const useMintNFT = () => {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const mintNFT = async (imageFile) => {
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

      // Now deploy our own NFT contract
      console.log('🚀 Deploying our own NFT contract...')

      // Auto-generate name and symbol
      const timestamp = Date.now()
      const shortName = `TXHub NFT #${timestamp.toString().slice(-6)}`
      const shortSymbol = `TXH${timestamp.toString().slice(-3)}`

      console.log('📝 Auto-generated parameters:', { shortName, shortSymbol })

      // Create base URI for metadata - we'll use a simple JSON metadata
      const baseURI = `data:application/json;base64,${btoa(JSON.stringify({
        name: shortName,
        symbol: shortSymbol,
        description: "NFT created on TXHub - Base Network",
        image: imageFile ? `data:image/png;base64,${imageFile}` : "https://via.placeholder.com/300x300/667eea/ffffff?text=TXHub+NFT",
        attributes: [
          { trait_type: "Creator", value: "TXHub" },
          { trait_type: "Network", value: "Base" },
          { trait_type: "Created", value: new Date().toISOString() }
        ]
      }))}`

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
            gas: '0x1e848', // 125,000 gas limit (0x1e848 in hex)
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
            gas: 125000n, // Gas limit for contract deployment
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
          gas: 125000n, // Gas limit for contract deployment
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
      const contractAddress = deployReceipt.contractAddress

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

      setSuccessMessage(`✅ NFT "${shortName}" (${shortSymbol}) minted successfully! Contract: ${contractAddress}`)

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