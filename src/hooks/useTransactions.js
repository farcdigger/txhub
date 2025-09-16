import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useFarcaster } from '../contexts/FarcasterContext'
import { addXP, addBonusXP } from '../utils/xpUtils'
import { getCurrentConfig, getContractAddress, GAS_CONFIG, GAME_CONFIG } from '../config/base'
import { parseEther, encodeFunctionData } from 'viem'

export const useTransactions = () => {
  const { isInFarcaster, sendTransaction, sendNotification } = useFarcaster()
  const { address, chainId } = useAccount()
  const { writeContract } = useWriteContract()
  const { isLoading: isTransactionLoading } = useWaitForTransactionReceipt()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const getProvider = () => {
    if (isInFarcaster) {
      // In Farcaster, use the SDK's provider
      return null // SDK handles this
    } else {
      // Regular web3 provider
      return new ethers.BrowserProvider(window.ethereum)
    }
  }

  const ensureBaseNetwork = async () => {
    // Force Base Mainnet (Chain ID: 8453)
    const baseMainnetChainId = 8453
    if (chainId !== baseMainnetChainId) {
      await switchToBaseNetwork()
      return false
    }
    return true
  }

  const sendGMTransaction = async (message = 'GM!') => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const isOnBase = await ensureBaseNetwork()
      if (!isOnBase) {
        throw new Error('Please switch to Base network')
      }

      const contractAddress = getContractAddress('GM_GAME')
      
      // Encode the function call: sendGM(string message)
      const data = encodeFunctionData({
        abi: [{
          name: 'sendGM',
          type: 'function',
          stateMutability: 'payable',
          inputs: [{ name: 'message', type: 'string' }]
        }],
        functionName: 'sendGM',
        args: [message]
      })
      
      let result
      
      if (isInFarcaster) {
        // Use Farcaster SDK for transaction
        const transaction = {
          to: contractAddress,
          data: data,
          value: parseEther('0.000005').toString(), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        }

        result = await sendTransaction(transaction)
        
        // Send notification
        await sendNotification({
          title: 'GM Sent!',
          body: `You earned 10 XP!`,
        })
      } else {
        // Use Wagmi for web transactions
        result = await writeContract({
          address: contractAddress,
          abi: [{
            name: 'sendGM',
            type: 'function',
            stateMutability: 'payable',
            inputs: [{ name: 'message', type: 'string' }]
          }],
          functionName: 'sendGM',
          args: [message],
          value: parseEther('0.000005'), // 0.000005 ETH fee
        })
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for GM transaction:', { address, txHash })
          await addBonusXP(address, 'gm', false) // GM gives 10 XP (no bonus)
          console.log('XP added successfully for GM transaction')
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const sendGNTransaction = async (message = 'GN!') => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const isOnBase = await ensureBaseNetwork()
      if (!isOnBase) {
        throw new Error('Please switch to Base network')
      }

      const contractAddress = getContractAddress('GN_GAME')
      
      // Encode the function call: sendGN(string message)
      const iface = new ethers.Interface([
        "function sendGN(string memory message) external payable"
      ])
      const data = iface.encodeFunctionData("sendGN", [message])
      
      let result
      
      if (isInFarcaster) {
        const transaction = {
          to: contractAddress,
          data: data,
          value: parseEther('0.000005').toString(), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        }

        result = await sendTransaction(transaction)
        
        await sendNotification({
          title: 'GN Sent!',
          body: `You earned 10 XP!`,
        })
      } else {
        const provider = getProvider()
        const signer = await provider.getSigner()
        
        const tx = await signer.sendTransaction({
          to: contractAddress,
          data: data,
          value: parseEther('0.000005'), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        })

        await tx.wait()
        result = tx
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for GN transaction:', { address, txHash })
          await addBonusXP(address, 'gn', false) // GN gives 10 XP (no bonus)
          console.log('XP added successfully for GN transaction')
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const sendFlipTransaction = async (selectedSide) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const isOnBase = await ensureBaseNetwork()
      if (!isOnBase) {
        throw new Error('Please switch to Base network')
      }

      const contractAddress = getContractAddress('FLIP_GAME')
      
      // Encode the function call: playFlip(uint8 choice) where 0=Heads, 1=Tails
      const iface = new ethers.Interface([
        "function playFlip(uint8 choice) external payable"
      ])
      const choice = selectedSide === 'heads' ? 0 : 1
      const data = iface.encodeFunctionData("playFlip", [choice])
      
      let result
      
      if (isInFarcaster) {
        const transaction = {
          to: contractAddress,
          data: data,
          value: parseEther('0.000005').toString(), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        }

        result = await sendTransaction(transaction)
        
        await sendNotification({
          title: 'Coin Flipped!',
          body: `You earned 15 XP! Check the result on Base network!`,
        })
      } else {
        const provider = getProvider()
        const signer = await provider.getSigner()
        
        const tx = await signer.sendTransaction({
          to: contractAddress,
          data: data,
          value: parseEther('0.000005'), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        })

        await tx.wait()
        result = tx
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for Flip Game transaction:', { address, txHash })
          // Check if player won (you'll need to get this from contract result)
          const isWin = result.isWin || false // This should come from contract
          await addBonusXP(address, 'flip', isWin) // Flip Game gives 10 XP + 500 bonus if win
          console.log('XP added successfully for Flip Game transaction')
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const sendSlothTransaction = async (duration) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const isOnBase = await ensureBaseNetwork()
      if (!isOnBase) {
        throw new Error('Please switch to Base network')
      }

      const contractAddress = getContractAddress('SLOTH_GAME')
      
      // Encode the function call: startSlothSession()
      const iface = new ethers.Interface([
        "function startSlothSession() external payable"
      ])
      const data = iface.encodeFunctionData("startSlothSession", [])
      
      if (isInFarcaster) {
        const transaction = {
          to: contractAddress,
          data: data,
          value: parseEther('0.000005').toString(), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        }

        const result = await sendTransaction(transaction)
        
        await sendNotification({
          title: 'Sloth Session Started!',
          body: `Be patient to earn XP!`,
        })

        return result
      } else {
        const provider = getProvider()
        const signer = await provider.getSigner()
        
        const tx = await signer.sendTransaction({
          to: contractAddress,
          data: data,
          value: parseEther('0.000005'), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        })

        await tx.wait()
        return tx
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const sendLuckyNumberTransaction = async (guess) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const isOnBase = await ensureBaseNetwork()
      if (!isOnBase) {
        throw new Error('Please switch to Base network')
      }

      const contractAddress = getContractAddress('LUCKY_NUMBER')
      
      // Encode the function call: guessLuckyNumber(uint256 guess)
      const iface = new ethers.Interface([
        "function guessLuckyNumber(uint256 guess) external payable"
      ])
      const data = iface.encodeFunctionData("guessLuckyNumber", [guess])
      
      let result
      
      if (isInFarcaster) {
        const transaction = {
          to: contractAddress,
          data: data,
          value: parseEther('0.000005').toString(), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        }

        result = await sendTransaction(transaction)
        
        await sendNotification({
          title: 'Lucky Number Guessed!',
          body: `You earned XP! Check if you won bonus XP!`,
        })
      } else {
        const provider = getProvider()
        const signer = await provider.getSigner()
        
        const tx = await signer.sendTransaction({
          to: contractAddress,
          data: data,
          value: parseEther('0.000005'), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        })

        await tx.wait()
        result = tx
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for Lucky Number transaction:', { address, txHash })
          // Check if player won (you'll need to get this from contract result)
          const isWin = result.isWin || false // This should come from contract
          await addBonusXP(address, 'luckynumber', isWin) // Lucky Number gives 10 XP + 1000 bonus if win
          console.log('XP added successfully for Lucky Number transaction')
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const sendDiceRollTransaction = async (guess) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const isOnBase = await ensureBaseNetwork()
      if (!isOnBase) {
        throw new Error('Please switch to Base network')
      }

      const contractAddress = getContractAddress('DICE_ROLL')
      
      // Encode the function call: rollDice(uint256 guess)
      const iface = new ethers.Interface([
        "function rollDice(uint256 guess) external payable"
      ])
      const data = iface.encodeFunctionData("rollDice", [guess])
      
      let result
      
      if (isInFarcaster) {
        const transaction = {
          to: contractAddress,
          data: data,
          value: parseEther('0.000005').toString(), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        }

        result = await sendTransaction(transaction)
        
        await sendNotification({
          title: 'Dice Rolled!',
          body: `You earned XP! Check if you won bonus XP!`,
        })
      } else {
        const provider = getProvider()
        const signer = await provider.getSigner()
        
        const tx = await signer.sendTransaction({
          to: contractAddress,
          data: data,
          value: parseEther('0.000005'), // 0.000005 ETH fee
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        })

        await tx.wait()
        result = tx
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for Dice Roll transaction:', { address, txHash })
          // Check if player won (you'll need to get this from contract result)
          const isWin = result.isWin || false // This should come from contract
          await addBonusXP(address, 'diceroll', isWin) // Dice Roll gives 10 XP + 1500 bonus if win
          console.log('XP added successfully for Dice Roll transaction')
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
      
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const sendCustomTransaction = async (contractAddress, functionData, value = '0') => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const isOnBase = await ensureBaseNetwork()
      if (!isOnBase) {
        throw new Error('Please switch to Base network')
      }
      
      if (isInFarcaster) {
        const transaction = {
          to: contractAddress,
          data: functionData,
          value: value,
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        }

        const result = await sendTransaction(transaction)
        
        await sendNotification({
          title: 'Transaction Sent!',
          body: 'Your custom transaction has been submitted to Base network.',
        })

        return result
      } else {
        const provider = getProvider()
        const signer = await provider.getSigner()
        
        const tx = await signer.sendTransaction({
          to: contractAddress,
          data: functionData,
          value: value,
          gasLimit: GAS_CONFIG.GAS_LIMIT,
        })

        await tx.wait()
        return tx
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    sendGMTransaction,
    sendGNTransaction,
    sendFlipTransaction,
    sendLuckyNumberTransaction,
    sendDiceRollTransaction,
    sendCustomTransaction,
  }
}
