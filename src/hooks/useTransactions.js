import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useFarcaster } from '../contexts/FarcasterContext'
import { addXP } from '../utils/xpUtils'
import { getCurrentConfig, getContractAddress, GAS_CONFIG, GAME_CONFIG } from '../config/base'
import { parseEther } from 'viem'

export const useTransactions = () => {
  const { isInFarcaster, sendNotification } = useFarcaster()
  const { address, chainId } = useAccount()
  const { writeContract } = useWriteContract()
  const { isLoading: isTransactionLoading } = useWaitForTransactionReceipt()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Farcaster-only app - no need for provider checks

  const sendGMTransaction = async (message = 'GM!') => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const contractAddress = getContractAddress('GM_GAME')
      
      // Always use Wagmi for transactions (Farcaster handles wallet connection)
      const result = await writeContract({
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
      
      // Send Farcaster notification if available
      if (isInFarcaster && sendNotification) {
        try {
          await sendNotification({
            title: 'GM Sent!',
            body: `You earned 10 XP!`,
          })
        } catch (notificationError) {
          console.log('Notification failed:', notificationError)
        }
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for GM transaction:', { address, txHash })
          await addXP(address, 10) // GM gives 10 XP
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
      const contractAddress = getContractAddress('GN_GAME')
      
      // Always use Wagmi for transactions (Farcaster handles wallet connection)
      const result = await writeContract({
        address: contractAddress,
        abi: [{
          name: 'sendGN',
          type: 'function',
          stateMutability: 'payable',
          inputs: [{ name: 'message', type: 'string' }]
        }],
        functionName: 'sendGN',
        args: [message],
        value: parseEther('0.000005'), // 0.000005 ETH fee
      })
      
      // Send Farcaster notification if available
      if (isInFarcaster && sendNotification) {
        try {
          await sendNotification({
            title: 'GN Sent!',
            body: `You earned 10 XP!`,
          })
        } catch (notificationError) {
          console.log('Notification failed:', notificationError)
        }
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for GN transaction:', { address, txHash })
          await addXP(address, 10) // GN gives 10 XP
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

      const contractAddress = getContractAddress('FLIP_GAME')
      
      // Encode the function call: playFlip(uint8 choice) where 0=Heads, 1=Tails
      const choice = selectedSide === 'heads' ? 0 : 1
      
      // Always use Wagmi for transactions (Farcaster handles wallet connection)
      const result = await writeContract({
        address: contractAddress,
        abi: [{
          name: 'playFlip',
          type: 'function',
          stateMutability: 'payable',
          inputs: [{ name: 'choice', type: 'uint8' }]
        }],
        functionName: 'playFlip',
        args: [choice],
        value: parseEther('0.000005'), // 0.000005 ETH fee
      })
      
      // Send Farcaster notification if available
      if (isInFarcaster && sendNotification) {
        try {
          await sendNotification({
            title: 'Coin Flipped!',
            body: `You earned 15 XP! Check the result on Base network!`,
          })
        } catch (notificationError) {
          console.log('Notification failed:', notificationError)
        }
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for Flip Game transaction:', { address, txHash })
          await addXP(address, 15) // Flip Game gives 15 XP
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

      const contractAddress = getContractAddress('SLOTH_GAME')
      
      // Encode the function call: startSlothSession()
      const data = encodeFunctionData({
        abi: [{
          name: 'startSlothSession',
          type: 'function',
          stateMutability: 'payable',
          inputs: []
        }],
        functionName: 'startSlothSession',
        args: []
      })
      
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

      const contractAddress = getContractAddress('LUCKY_NUMBER')
      
      // Always use Wagmi for transactions (Farcaster handles wallet connection)
      const result = await writeContract({
        address: contractAddress,
        abi: [{
          name: 'guessLuckyNumber',
          type: 'function',
          stateMutability: 'payable',
          inputs: [{ name: 'guess', type: 'uint256' }]
        }],
        functionName: 'guessLuckyNumber',
        args: [guess],
        value: parseEther('0.000005'), // 0.000005 ETH fee
      })
      
      // Send Farcaster notification if available
      if (isInFarcaster && sendNotification) {
        try {
          await sendNotification({
            title: 'Lucky Number Guessed!',
            body: `You earned XP! Check if you won bonus XP!`,
          })
        } catch (notificationError) {
          console.log('Notification failed:', notificationError)
        }
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for Lucky Number transaction:', { address, txHash })
          await addXP(address, 20) // Lucky Number gives 20 XP
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

      const contractAddress = getContractAddress('DICE_ROLL')
      
      // Always use Wagmi for transactions (Farcaster handles wallet connection)
      const result = await writeContract({
        address: contractAddress,
        abi: [{
          name: 'rollDice',
          type: 'function',
          stateMutability: 'payable',
          inputs: [{ name: 'guess', type: 'uint256' }]
        }],
        functionName: 'rollDice',
        args: [guess],
        value: parseEther('0.000005'), // 0.000005 ETH fee
      })
      
      // Send Farcaster notification if available
      if (isInFarcaster && sendNotification) {
        try {
          await sendNotification({
            title: 'Dice Rolled!',
            body: `You earned XP! Check if you won bonus XP!`,
          })
        } catch (notificationError) {
          console.log('Notification failed:', notificationError)
        }
      }
      
      // Add XP to player after successful transaction
        try {
          const txHash = result.hash || result.transactionHash
          console.log('Adding XP for Dice Roll transaction:', { address, txHash })
          await addXP(address, 25) // Dice Roll gives 25 XP
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
      
      // For custom transactions, we need to use sendTransaction from Wagmi
      // since we don't have ABI information
      const { sendTransaction } = await import('wagmi/actions')
      const { config } = await import('../config/wagmi')
      
      const result = await sendTransaction(config, {
        to: contractAddress,
        data: functionData,
        value: BigInt(value),
      })
      
      // Send Farcaster notification if available
      if (isInFarcaster && sendNotification) {
        try {
          await sendNotification({
            title: 'Transaction Sent!',
            body: 'Your custom transaction has been submitted to Base network.',
          })
        } catch (notificationError) {
          console.log('Notification failed:', notificationError)
        }
      }

      return result
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
