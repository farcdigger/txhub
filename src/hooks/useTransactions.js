import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { useFarcaster } from '../contexts/FarcasterContext'
import { addXP, addBonusXP } from '../utils/xpUtils'
import { getCurrentConfig, getContractAddress, GAS_CONFIG, GAME_CONFIG } from '../config/base'
import { parseEther } from 'viem'
import { config } from '../config/wagmi'

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
      
      console.log('📡 Step 1: Sending GM transaction to blockchain...')
      
      // Step 1: Send transaction (ONLY gets hash, NOT confirmed yet!)
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
      
      console.log('📡 Step 2: Transaction sent! Hash:', txHash, '⏳ WAITING for blockchain confirmation...')
      
      // Step 2: Wait for REAL blockchain confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1, // Wait for at least 1 confirmation
      })
      
      console.log('✅ Step 3: GM transaction CONFIRMED on blockchain!', receipt)
      
      // Step 3: ONLY NOW add XP after real confirmation
      try {
        await addXP(address, 10) // GM gives 10 XP
        console.log('✅ XP added successfully AFTER blockchain confirmation')
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
      
      console.log('📡 Step 1: Sending GN transaction to blockchain...')
      
      // Step 1: Send transaction (ONLY gets hash, NOT confirmed yet!)
      const txHash = await writeContract({
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
      
      console.log('📡 Step 2: Transaction sent! Hash:', txHash, '⏳ WAITING for blockchain confirmation...')
      
      // Step 2: Wait for REAL blockchain confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1, // Wait for at least 1 confirmation
      })
      
      console.log('✅ Step 3: GN transaction CONFIRMED on blockchain!', receipt)
      
      // Step 3: ONLY NOW add XP after real confirmation
      try {
        await addXP(address, 10) // GN gives 10 XP
        console.log('✅ XP added successfully AFTER blockchain confirmation')
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
      
      console.log('📡 Step 1: Sending Flip transaction to blockchain...')
      
      // Step 1: Send transaction (ONLY gets hash, NOT confirmed yet!)
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
      
      console.log('📡 Step 2: Transaction sent! Hash:', txHash, '⏳ WAITING for blockchain confirmation...')
      
      // Step 2: Wait for REAL blockchain confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1, // Wait for at least 1 confirmation
      })
      
      console.log('✅ Step 3: Flip transaction CONFIRMED on blockchain!', receipt)
      
      // Step 3: Generate game result ONLY after confirmation
      const actualResult = Math.random() < 0.5 ? 'heads' : 'tails'
      const playerWon = (selectedSide === 'heads' && actualResult === 'heads') || 
                       (selectedSide === 'tails' && actualResult === 'tails')
      
      console.log('🎲 Game result AFTER confirmation:', { selectedSide, actualResult, playerWon })
      
      // Step 4: Add XP ONLY after blockchain confirmation
      try {
        await addBonusXP(address, 'flip', playerWon)
        const xpEarned = playerWon ? 10 + 500 : 10 // Base + bonus or just base
        console.log(`✅ XP added AFTER confirmation: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
      } catch (xpError) {
        console.error('Error adding XP:', xpError)
      }
      
      // Return game result for UI display (ONLY after confirmation)
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
      
      console.log('📡 Step 1: Sending Lucky Number transaction to blockchain...')
      
      // Step 1: Send transaction (ONLY gets hash, NOT confirmed yet!)
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
      
      console.log('📡 Step 2: Transaction sent! Hash:', txHash, '⏳ WAITING for blockchain confirmation...')
      
      // Step 2: Wait for REAL blockchain confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1, // Wait for at least 1 confirmation
      })
      
      console.log('✅ Step 3: Lucky Number transaction CONFIRMED on blockchain!', receipt)
      
      // Step 3: Generate game result ONLY after confirmation
      const winningNumber = Math.floor(Math.random() * 10) + 1
      const playerWon = guess === winningNumber
      
      console.log('🎲 Lucky Number result AFTER confirmation:', { guess, winningNumber, playerWon })
      
      // Step 4: Add XP ONLY after blockchain confirmation
      try {
        await addBonusXP(address, 'luckynumber', playerWon)
        const xpEarned = playerWon ? 10 + 1000 : 10 // Base + bonus or just base
        console.log(`✅ XP added AFTER confirmation: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
      } catch (xpError) {
        console.error('Error adding XP:', xpError)
      }
      
      // Return game result for UI display (ONLY after confirmation)
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
      
      console.log('📡 Step 1: Sending Dice Roll transaction to blockchain...')
      
      // Step 1: Send transaction (ONLY gets hash, NOT confirmed yet!)
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
      
      console.log('📡 Step 2: Transaction sent! Hash:', txHash, '⏳ WAITING for blockchain confirmation...')
      
      // Step 2: Wait for REAL blockchain confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1, // Wait for at least 1 confirmation
      })
      
      console.log('✅ Step 3: Dice Roll transaction CONFIRMED on blockchain!', receipt)
      
      // Step 3: Generate game result ONLY after confirmation
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      const diceTotal = dice1 + dice2
      const playerWon = guess === diceTotal
      
      console.log('🎲 Dice Roll result AFTER confirmation:', { guess, dice1, dice2, diceTotal, playerWon })
      
      // Step 4: Add XP ONLY after blockchain confirmation
      try {
        await addBonusXP(address, 'diceroll', playerWon)
        const xpEarned = playerWon ? 10 + 1500 : 10 // Base + bonus or just base
        console.log(`✅ XP added AFTER confirmation: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
      } catch (xpError) {
        console.error('Error adding XP:', xpError)
      }
      
      // Return game result for UI display (ONLY after confirmation)
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
