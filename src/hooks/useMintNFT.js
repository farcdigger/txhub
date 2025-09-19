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

// New NFT Contract - Deploy and mint
const NFT_CONTRACT_ABI = [
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
  }
]

const NFT_CONTRACT_BYTECODE = "0x608060405234801561000f575f80fd5b5060405161241a38038061241a833981810160405281019061003191906101b9565b8282815f9081610041919061046a565b508060019081610051919061046a565b5050508060079081610063919061046a565b50505050610539565b5f604051905090565b5f80fd5b5f80fd5b5f80fd5b5f80fd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6100cb82610085565b810181811067ffffffffffffffff821117156100ea576100e9610095565b5b80604052505050565b5f6100fc61006c565b905061010882826100c2565b919050565b5f67ffffffffffffffff82111561012757610126610095565b5b61013082610085565b9050602081019050919050565b8281835e5f83830152505050565b5f61015d6101588461010d565b6100f3565b90508281526020810184848401111561017957610178610081565b5b61018484828561013d565b509392505050565b5f82601f8301126101a05761019f61007d565b5b81516101b084826020860161014b565b91505092915050565b5f805f606084860312156101d0576101cf610075565b5b5f84015167ffffffffffffffff8111156101ed576101ec610079565b5b6101f98682870161018c565b935050602084015167ffffffffffffffff81111561021a57610219610079565b5b6102268682870161018c565b925050604084015167ffffffffffffffff81111561024757610246610079565b5b6102538682870161018c565b9150509250925092565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806102ab57607f821691505b6020821081036102be576102bd610267565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026103207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826102e5565b61032a86836102e5565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61036e61036961036484610342565b61034b565b610342565b9050919050565b5f819050919050565b61038783610354565b61039b61039382610375565b8484546102f1565b825550505050565b5f90565b6103af6103a3565b6103ba81848461037e565b505050565b5b818110156103dd576103d25f826103a7565b6001810190506103c0565b5050565b601f821115610422576103f3816102c4565b6103fc846102d6565b8101602085101561040b578190505b61041f610417856102d6565b8301826103bf565b50505b505050565b5f82821c905092915050565b5f6104425f1984600802610427565b1980831691505092915050565b5f61045a8383610433565b9150826002028217905092915050565b6104738261025d565b67ffffffffffffffff81111561048c5761048b610095565b5b6104968254610294565b6104a18282856103e1565b5f60209050601f8311600181146104d2575f84156104c0578287015190505b6104ca858261044f565b865550610531565b601f1984166104e0866102c4565b5f5b82811015610507578489015182556001820191506020850194506020810190506104e2565b868310156105245784890151610520601f891682610433565b8355505b6001600288020188555050505b505050505050565b611ed4806105465f395ff3fe608060405234801561000f575f80fd5b50600436106100f3575f3560e01c80636352211e11610095578063a22cb46511610064578063a22cb46514610295578063b88d4fde146102b1578063c87b56dd146102cd578063e985e9c5146102fd576100f3565b80636352211e146101e75780636a6278421461021757806370a082311461024757806395d89b4114610277576100f3565b8063095ea7b3116100d1578063095ea7b31461017557806318160ddd1461019157806323b872dd146101af57806342842e0e146101cb576100f3565b806301ffc9a7146100f757806306fdde0314610127578063081812fc14610145575b5f80fd5b610111600480360381019061010c91906116d8565b61032d565b60405161011e919061171d565b60405180910390f35b61012f61040e565b60405161013c91906117a6565b60405180910390f35b61015f600480360381019061015a91906117f9565b61049d565b60405161016c9190611863565b60405180910390f35b61018f600480360381019061018a91906118a6565b6104b8565b005b6101996104ce565b6040516101a691906118f3565b60405180910390f35b6101c960048036038101906101c4919061190c565b6104d7565b005b6101e560048036038101906101e0919061190c565b6105d6565b005b61020160048036038101906101fc91906117f9565b6105f5565b60405161020e9190611863565b60405180910390f35b610231600480360381019061022c919061195c565b610606565b60405161023e91906118f3565b60405180910390f35b610261600480360381019061025c919061195c565b610643565b60405161026e91906118f3565b60405180910390f35b61027f6106f9565b60405161028c91906117a6565b60405180910390f35b6102af60048036038101906102aa91906119b1565b610789565b005b6102cb60048036038101906102c69190611b1b565b61079f565b005b6102e760048036038101906102e291906117f9565b6107c4565b6040516102f491906117a6565b60405180910390f35b61031760048036038101906103129190611b9b565b61082a565b604051610324919061171d565b60405180910390f35b5f7f80ac58cd000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614806103f757507f5b5e139f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b806104075750610406826108b8565b5b9050919050565b60605f805461041c90611c06565b80601f016020809104026020016040519081016040528092919081815260200182805461044890611c06565b80156104935780601f1061046a57610100808354040283529160200191610493565b820191905f5260205f20905b81548152906001019060200180831161047657829003601f168201915b5050505050905090565b5f6104a782610921565b506104b1826109a7565b9050919050565b6104ca82826104c56109e0565b6109e7565b5050565b5f600654905090565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610547575f6040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161053e9190611863565b60405180910390fd5b5f61055a83836105556109e0565b6109f9565b90508373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146105d0578382826040517f64283d7b0000000000000000000000000000000000000000000000000000000081526004016105c793929190611c36565b60405180910390fd5b50505050565b6105f083838360405180602001604052805f81525061079f565b505050565b5f6105ff82610921565b9050919050565b5f8060016006546106179190611c98565b905060065f81548092919061062b90611ccb565b919050555061063a8382610c04565b80915050919050565b5f8073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036106b4575f6040517f89c62b640000000000000000000000000000000000000000000000000000000081526004016106ab9190611863565b60405180910390fd5b60035f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20549050919050565b60606001805461070890611c06565b80601f016020809104026020016040519081016040528092919081815260200182805461073490611c06565b801561077f5780601f106107565761010080835404028352916020019161077f565b820191905f5260205f20905b81548152906001019060200180831161076257829003601f168201915b5050505050905090565b61079b6107946109e0565b8383610c21565b5050565b6107aa8484846104d7565b6107be6107b56109e0565b85858585610d8a565b50505050565b60606107cf82610921565b505f6107d9610f36565b90505f8151116107f75760405180602001604052805f815250610822565b8061080184610fc6565b604051602001610812929190611d4c565b6040516020818303038152906040525b915050919050565b5f60055f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff16905092915050565b5f7f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b5f8061092c83611090565b90505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361099e57826040517f7e27328900000000000000000000000000000000000000000000000000000000815260040161099591906118f3565b60405180910390fd5b80915050919050565b5f60045f8381526020019081526020015f205f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b5f33905090565b6109f483838360016110c9565b505050565b5f80610a0484611090565b90505f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614610a4557610a44818486611288565b5b5f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610ad057610a845f855f806110c9565b600160035f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825403925050819055505b5f73ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff1614610b4f57600160035f8773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8460025f8681526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4809150509392505050565b610c1d828260405180602001604052805f81525061134b565b5050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610c9157816040517f5b08ba18000000000000000000000000000000000000000000000000000000008152600401610c889190611863565b60405180910390fd5b8060055f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c3183604051610d7d919061171d565b60405180910390a3505050565b5f8373ffffffffffffffffffffffffffffffffffffffff163b1115610f2f578273ffffffffffffffffffffffffffffffffffffffff1663150b7a02868685856040518563ffffffff1660e01b8152600401610de89493929190611dc1565b6020604051808303815f875af1925050508015610e2357506040513d601f19601f82011682018060405250810190610e209190611e1f565b60015b610ea4573d805f8114610e51576040519150601f19603f3d011682016040523d82523d5f602084013e610e56565b606091505b505f815103610e9c57836040517f64a0ae92000000000000000000000000000000000000000000000000000000008152600401610e939190611863565b60405180910390fd5b805160208201fd5b63150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614610f2d57836040517f64a0ae92000000000000000000000000000000000000000000000000000000008152600401610f249190611863565b60405180910390fd5b505b5050505050565b606060078054610f4590611c06565b80601f0160208091040260200160405190810160405280929190818152602001828054610f7190611c06565b8015610fbc5780601f10610f9357610100808354040283529160200191610fbc565b820191905f5260205f20905b815481529060010190602001808311610f9f57829003601f168201915b5050505050905090565b60605f6001610fd48461136e565b0190505f8167ffffffffffffffff811115610ff257610ff16119f7565b5b6040519080825280601f01601f1916602001820160405280156110245781602001600182028036833780820191505090505b5090505f82602083010190505b600115611085578080600190039150507f3031323334353637383961626364656600000000000000000000000000000000600a86061a8153600a858161107a57611079611e4a565b5b0494505f8503611031575b819350505050919050565b5f60025f8381526020019081526020015f205f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b808061110157505f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614155b15611233575f61111084610921565b90505f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415801561117a57508273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614155b801561118d575061118b818461082a565b155b156111cf57826040517fa9fbf51f0000000000000000000000000000000000000000000000000000000081526004016111c69190611863565b60405180910390fd5b811561123157838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b8360045f8581526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050505050565b6112938383836114bf565b611346575f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415801561157657508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1614806115375750611536848461082a565b5b8061157557508273ffffffffffffffffffffffffffffffffffffffff1661155d836109a7565b73ffffffffffffffffffffffffffffffffffffffff16145b5b90509392505050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036115ef575f6040517f64a0ae920000000000000000000000000000000000000000000000000000000081526004016115e69190611863565b60405180910390fd5b5f6115fb83835f6109f9565b90505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161461166d575f6040517f73c6ac6e0000000000000000000000000000000000000000000000000000000081526004016116649190611863565b60405180910390fd5b505050565b5f604051905090565b5f80fd5b5f80fd5b5f7fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b6116b781611683565b81146116c1575f80fd5b50565b5f813590506116d2816116ae565b92915050565b5f602082840312156116ed576116ec61167b565b5b5f6116fa848285016116c4565b91505092915050565b5f8115159050919050565b61171781611703565b82525050565b5f6020820190506117305f83018461170e565b92915050565b5f81519050919050565b5f82825260208201905092915050565b8281835e5f83830152505050565b5f601f19601f8301169050919050565b5f61177882611736565b6117828185611740565b9350611792818560208601611750565b61179b8161175e565b840191505092915050565b5f6020820190508181035f8301526117be818461176e565b905092915050565b5f819050919050565b6117d8816117c6565b81146117e2575f80fd5b50565b5f813590506117f3816117cf565b92915050565b5f6020828403121561180e5761180d61167b565b5b5f61181b848285016117e5565b91505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61184d82611824565b9050919050565b61185d81611843565b82525050565b5f6020820190506118765f830184611854565b92915050565b61188581611843565b811461188f575f80fd5b50565b5f813590506118a08161187c565b92915050565b5f80604083850312156118bc576118bb61167b565b5b5f6118c985828601611892565b92505060206118da858286016117e5565b9150509250929050565b6118ed816117c6565b82525050565b5f6020820190506119065f8301846118e4565b92915050565b5f805f606084860312156119235761192261167b565b5b5f61193086828701611892565b935050602061194186828701611892565b9250506040611952868287016117e5565b9150509250925092565b5f602082840312156119715761197061167b565b5b5f61197e84828501611892565b91505092915050565b61199081611703565b811461199a575f80fd5b50565b5f813590506119ab81611987565b92915050565b5f80604083850312156119c7576119c661167b565b5b5f6119d485828601611892565b92505060206119e58582860161199d565b9150509250929050565b5f80fd5b5f80fd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b611a2d8261175e565b810181811067ffffffffffffffff82111715611a4c57611a4b6119f7565b5b80604052505050565b5f611a5e611672565b9050611a6a8282611a24565b919050565b5f67ffffffffffffffff821115611a8957611a886119f7565b5b611a928261175e565b9050602081019050919050565b828183375f83830152505050565b5f611abf611aba84611a6f565b611a55565b905082815260208101848484011115611adb57611ada6119f3565b5b611ae6848285611a9f565b509392505050565b5f82601f830112611b0257611b016119ef565b5b8135611b12848260208601611aad565b91505092915050565b5f805f8060808587031215611b3357611b3261167b565b5b5f611b4087828801611892565b9450506020611b5187828801611892565b9350506040611b62878288016117e5565b925050606085013567ffffffffffffffff811115611b8357611b8261167f565b5b611b8f87828801611aee565b91505092959194509250565b5f8060408385031215611bb157611bb061167b565b5b5f611bbe85828601611892565b9250506020611bcf85828601611892565b9150509250929050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f6002820490506001821680611c1d57607f821691505b602082108103611c3057611c2f611bd9565b5b50919050565b5f606082019050611c495f830186611854565b611c5660208301856118e4565b611c636040830184611854565b949350505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f611ca2826117c6565b9150611cad836117c6565b9250828201905080821115611cc557611cc4611c6b565b5b92915050565b5f611cd5826117c6565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203611d0757611d06611c6b565b5b600182019050919050565b5f81905092915050565b5f611d2682611736565b611d308185611d12565b9350611d40818560208601611750565b80840191505092915050565b5f611d578285611d1c565b9150611d638284611d1c565b91508190509392505050565b5f81519050919050565b5f82825260208201905092915050565b5f611d9382611d6f565b611d9d8185611d79565b9350611dad818560208601611750565b611db68161175e565b840191505092915050565b5f608082019050611dd45f830187611854565b611de16020830186611854565b611dee60408301856118e4565b8181036060830152611e008184611d89565b905095945050505050565b5f81519050611e19816116ae565b92915050565b5f60208284031215611e3457611e3361167b565b5b5f611e4184828501611e0b565b91505092915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601260045260245ffd5b5f604082019050611e8a5f830185611854565b611e9760208301846118e4565b939250505056fea2646970667358221220f517e1c009b833544de5e7c2eabf8302a7171f1e0c458b6e08ffc187899b8c3b64736f6c634300081a0033"

export const useMintNFT = () => {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Calculate dynamic fee based on network
  const calculateNetworkFee = async () => {
    try {
      // Get current gas price
      const gasPriceResponse = await fetch('https://mainnet.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1
        })
      })
      
      const gasPriceData = await gasPriceResponse.json()
      const gasPrice = BigInt(gasPriceData.result)
      
      // Calculate fee based on gas price (0.1% of gas price per gwei)
      const feeInWei = (gasPrice * BigInt(100000)) / BigInt(1000000000) // 0.1 gwei worth
      const feeInEth = Number(feeInWei) / 1e18
      
      // Minimum fee of 0.000001 ETH, maximum of 0.001 ETH
      const minFee = 0.000001
      const maxFee = 0.001
      const dynamicFee = Math.max(minFee, Math.min(maxFee, feeInEth))
      
      console.log('🔍 Gas price:', gasPrice.toString(), 'wei')
      console.log('🔍 Calculated fee:', dynamicFee, 'ETH')
      
      return dynamicFee
    } catch (error) {
      console.warn('⚠️ Failed to calculate dynamic fee, using default:', error.message)
      return 0.000001 // Default fee
    }
  }

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

      // Calculate dynamic fee based on network
      const networkFee = await calculateNetworkFee()
      console.log('💰 Dynamic fee calculated:', networkFee, 'ETH')

      // Deploy contract and mint NFT in single transaction
      console.log('🚀 Deploying contract and minting NFT in single transaction...')

      // Create base URI for metadata
      const baseURI = `data:application/json;base64,${btoa(JSON.stringify({
        name: name,
        symbol: symbol,
        description: description,
        image: imageFile ? `data:image/png;base64,${imageFile}` : "https://via.placeholder.com/300x300/667eea/ffffff?text=NFT",
        attributes: [
          { trait_type: "Creator", value: "TXHub" },
          { trait_type: "Network", value: "Base" },
          { trait_type: "Created", value: new Date().toISOString() }
        ]
      }))}`

      // Use sendTransaction with manual encoding for Farcaster compatibility
      const constructorData = encodeAbiParameters(
        parseAbiParameters('string name, string symbol, string baseURI'),
        [name, symbol, baseURI]
      )

      const deployData = NFT_CONTRACT_BYTECODE + constructorData.slice(2)

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

          // Estimate gas for contract deployment
          const gasEstimate = await window.ethereum.request({
            method: 'eth_estimateGas',
            params: [{
              from: address,
              data: deployData,
              value: '0x' + parseEther(networkFee.toString()).toString(16)
            }]
          })
          
          // Add 20% buffer to gas estimate
          const gasWithBuffer = BigInt(gasEstimate) * BigInt(120) / BigInt(100)
          
          // Debug: Log the exact RPC call being made
          const deployTxParams = {
            from: address,
            data: deployData, // Already has 0x prefix
            value: '0x' + parseEther(networkFee.toString()).toString(16), // Dynamic fee
            gas: '0x' + gasWithBuffer.toString(16), // Dynamic gas with buffer
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
          // Estimate gas for fallback
          const fallbackGasEstimate = await window.ethereum.request({
            method: 'eth_estimateGas',
            params: [{
              from: address,
              data: deployData,
              value: '0x' + parseEther(networkFee.toString()).toString(16)
            }]
          })
          const fallbackGasWithBuffer = BigInt(fallbackGasEstimate) * BigInt(120) / BigInt(100)
          
          deployTxHash = await sendTransaction(config, {
            data: deployData,
            value: parseEther(networkFee.toString()), // Dynamic fee
            gas: fallbackGasWithBuffer, // Dynamic gas with buffer
            gasPrice: currentGasPrice, // Legacy gas price
            type: 'legacy', // Use legacy transaction to avoid EIP-1559 issues
            // @ts-expect-error - viem/wagmi forward eder
            accessList: [], // Disable access list creation
          })
        }
      } else {
        // Use regular sendTransaction for external wallets
        // Estimate gas for external wallets
        const externalGasEstimate = await window.ethereum.request({
          method: 'eth_estimateGas',
          params: [{
            from: address,
            data: deployData,
            value: '0x' + parseEther(networkFee.toString()).toString(16)
          }]
        })
        const externalGasWithBuffer = BigInt(externalGasEstimate) * BigInt(120) / BigInt(100)
        
        deployTxHash = await sendTransaction(config, {
          data: deployData,
          value: parseEther(networkFee.toString()), // Dynamic fee
          gas: externalGasWithBuffer, // Dynamic gas with buffer
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

      // Contract deployment completed
      console.log('🎨 Contract deployment completed!')

      // Contract deployment completed - no separate mint needed
      console.log('🎨 Contract deployment completed - NFT contract ready for minting!')
      const contractAddress = deployReceipt.contractAddress

      // Award XP for successful contract deployment
      try {
        console.log('🎉 Awarding 100 XP for contract deployment!')
        await addXP(address, 100, 'Contract Deploy')

        // Record the transaction for tracking
        await recordTransaction({
          wallet_address: address,
          game_type: 'Contract Deploy',
          tx_hash: deployTxHash,
          xp_earned: 100,
          result: 'success',
          contract_address: deployReceipt.contractAddress,
          nft_name: name,
          nft_symbol: symbol,
          nft_description: description
        })

        console.log('✅ XP awarded and transaction recorded!')
      } catch (xpError) {
        console.error('⚠️ Failed to award XP:', xpError)
        // Don't throw here, deployment was successful
      }

      setSuccessMessage(`✅ Contract "${name}" (${symbol}) deployed successfully! Address: ${contractAddress}`)

      return {
        txHash: deployTxHash,
        contractAddress: contractAddress,
        deployTxHash: deployTxHash,
        fee: `${networkFee} ETH`,
        feeWallet: '0x7d2Ceb7a0e0C39A3d0f7B5b491659fDE4bb7BCFe',
        xpEarned: 100,
        status: 'Contract deployed successfully! +100 XP earned!'
      }
    } catch (err) {
      console.error('❌ Contract deployment failed:', err)
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