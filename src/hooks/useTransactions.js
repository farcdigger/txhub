import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useFarcaster } from '../contexts/FarcasterContext'
import { addXP } from '../utils/xpUtils'
import { getCurrentConfig, getContractAddress, GAS_CONFIG, GAME_CONFIG } from '../config/base'
import { parseEther } from 'viem'

export const useTransactions = () => {
  const { isInFarcaster } = useFarcaster()
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
      
      // Notification disabled due to Farcaster SDK issues
      console.log('✅ GM transaction completed successfully!')
      
      // Add XP to player after successful transaction
        try {
          console.log('Adding XP for GM transaction:', { address, result })
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
      
      // Notification disabled due to Farcaster SDK issues
      console.log('✅ GN transaction completed successfully!')
      
      // Add XP to player after successful transaction
        try {
          console.log('Adding XP for GN transaction:', { address, result })
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
      
      // Notification disabled due to Farcaster SDK issues
      console.log('✅ Flip transaction completed successfully!')
      
      // Add XP to player after successful transaction
        try {
          console.log('Adding XP for Flip Game transaction:', { address, result })
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
      
      // Notification disabled due to Farcaster SDK issues
      console.log('✅ Lucky Number transaction completed successfully!')
      
      // Add XP to player after successful transaction
        try {
          console.log('Adding XP for Lucky Number transaction:', { address, result })
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
      
      // Notification disabled due to Farcaster SDK issues
      console.log('✅ Dice Roll transaction completed successfully!')
      
      // Add XP to player after successful transaction
        try {
          console.log('Adding XP for Dice Roll transaction:', { address, result })
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
      
      // Notification disabled due to Farcaster SDK issues
      console.log('✅ Custom transaction completed successfully!')

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
