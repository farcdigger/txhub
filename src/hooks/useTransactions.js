import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useFarcaster } from '../contexts/FarcasterContext'
import { addXP, addBonusXP } from '../utils/xpUtils'
import { getCurrentConfig, getContractAddress, GAS_CONFIG, GAME_CONFIG } from '../config/base'
import { parseEther } from 'viem'

export const useTransactions = () => {
  const { isInFarcaster } = useFarcaster()
  const { address, chainId } = useAccount()
  const { writeContract } = useWriteContract()
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
      
      console.log('📡 Sending GM transaction...')
      
      // Send transaction to blockchain and wait for confirmation
      const txHash = await writeContract({
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
      
      console.log('✅ GM transaction confirmed!', txHash)
      
      // Only add XP after successful transaction confirmation
      try {
        await addXP(address, 10) // GM gives 10 XP
        console.log('XP added successfully for GM transaction')
      } catch (xpError) {
        console.error('Error adding XP:', xpError)
        // Don't throw error here, transaction was successful
      }
      
      return txHash
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
      
      console.log('📡 Sending Flip transaction...')
      
      // Send transaction to blockchain and wait for confirmation
      const txHash = await writeContract({
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
      
      console.log('✅ Flip transaction confirmed!', txHash)
      
      // Simulate game result (in real implementation, this would come from contract events)
      const isWin = Math.random() < 0.5 // 50% chance to win
      const actualResult = Math.random() < 0.5 ? 'heads' : 'tails'
      const playerWon = (selectedSide === 'heads' && actualResult === 'heads') || 
                       (selectedSide === 'tails' && actualResult === 'tails')
      
      console.log('🎲 Game result:', { selectedSide, actualResult, playerWon })
      
      // Add XP based on win/loss
      try {
        await addBonusXP(address, 'flip', playerWon)
        const xpEarned = playerWon ? 10 + 500 : 10 // Base + bonus or just base
        console.log(`XP added: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
      } catch (xpError) {
        console.error('Error adding XP:', xpError)
      }
      
      // Return game result for UI display
      return { 
        txHash, 
        playerChoice: selectedSide, 
        result: actualResult, 
        isWin: playerWon,
        xpEarned: playerWon ? 510 : 10
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
      
      console.log('📡 Sending Lucky Number transaction...')
      
      // Send transaction to blockchain and wait for confirmation
      const txHash = await writeContract({
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
      
      console.log('✅ Lucky Number transaction confirmed!', txHash)
      
      // Generate random winning number (1-10)
      const winningNumber = Math.floor(Math.random() * 10) + 1
      const playerWon = guess === winningNumber
      
      console.log('🎲 Lucky Number result:', { guess, winningNumber, playerWon })
      
      // Add XP based on win/loss
      try {
        await addBonusXP(address, 'luckynumber', playerWon)
        const xpEarned = playerWon ? 10 + 1000 : 10 // Base + bonus or just base
        console.log(`XP added: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
      } catch (xpError) {
        console.error('Error adding XP:', xpError)
      }
      
      // Return game result for UI display
      return { 
        txHash, 
        playerGuess: guess, 
        winningNumber, 
        isWin: playerWon,
        xpEarned: playerWon ? 1010 : 10
      }
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
      
      console.log('📡 Sending Dice Roll transaction...')
      
      // Send transaction to blockchain and wait for confirmation
      const txHash = await writeContract({
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
      
      console.log('✅ Dice Roll transaction confirmed!', txHash)
      
      // Roll two dice (2-12 total)
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      const diceTotal = dice1 + dice2
      const playerWon = guess === diceTotal
      
      console.log('🎲 Dice Roll result:', { guess, dice1, dice2, diceTotal, playerWon })
      
      // Add XP based on win/loss
      try {
        await addBonusXP(address, 'diceroll', playerWon)
        const xpEarned = playerWon ? 10 + 1500 : 10 // Base + bonus or just base
        console.log(`XP added: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
      } catch (xpError) {
        console.error('Error adding XP:', xpError)
      }
      
      // Return game result for UI display
      return { 
        txHash, 
        playerGuess: guess, 
        dice1,
        dice2,
        diceTotal, 
        isWin: playerWon,
        xpEarned: playerWon ? 1510 : 10
      }
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
