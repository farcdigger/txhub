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
      
      console.log('📡 Sending GM transaction to blockchain...')
      
      // Send transaction to blockchain
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
      
      console.log('✅ GM transaction sent! Hash:', txHash)
      
      // Even in Farcaster, wait for at least some confirmation
      console.log('⏳ Waiting for transaction confirmation...')
      try {
        // Wait for confirmation with shorter timeout for better UX
        const receipt = await Promise.race([
          waitForTransactionReceipt(config, {
            hash: txHash,
            confirmations: 1,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), 15000) // 15 seconds
          )
        ])
        
        console.log('✅ GM transaction confirmed!', receipt)
        
        try {
          await addXP(address, 10) // GM gives 10 XP
          console.log('✅ XP added after confirmation')
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
        
        return txHash
      } catch (confirmError) {
        console.warn('⚠️ Confirmation timeout:', confirmError.message)
        // Don't award XP if confirmation fails
        throw new Error('Transaction confirmation failed - please try again')
      }
      
      return txHash
    } catch (err) {
      console.error('❌ Transaction failed:', err)
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
      
      console.log('📡 Sending GN transaction to blockchain...')
      
      // Send transaction to blockchain
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
      
      console.log('✅ GN transaction sent! Hash:', txHash)
      
      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...')
      try {
        // Wait for confirmation with shorter timeout for better UX
        const receipt = await Promise.race([
          waitForTransactionReceipt(config, {
            hash: txHash,
            confirmations: 1,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), 15000) // 15 seconds
          )
        ])
        
        console.log('✅ GN transaction confirmed!', receipt)
        
        try {
          await addXP(address, 10) // GN gives 10 XP
          console.log('✅ XP added after confirmation')
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
        
        return txHash
      } catch (confirmError) {
        console.warn('⚠️ Confirmation timeout:', confirmError.message)
        // Don't award XP if confirmation fails
        throw new Error('Transaction confirmation failed - please try again')
      }
      
      return txHash
    } catch (err) {
      console.error('❌ Transaction failed:', err)
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
      
      console.log('📡 Sending Flip transaction to blockchain...')
      
      // Send transaction to blockchain
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
      
      console.log('✅ Flip transaction sent! Hash:', txHash)
      
      // Generate game result immediately after transaction submission
      const actualResult = Math.random() < 0.5 ? 'heads' : 'tails'
      const playerWon = (selectedSide === 'heads' && actualResult === 'heads') || 
                       (selectedSide === 'tails' && actualResult === 'tails')
      
      console.log('🎲 Game result:', { selectedSide, actualResult, playerWon })
      
      // In Farcaster environment, award XP immediately after transaction submission
      if (isInFarcaster) {
        console.log('🎯 Farcaster detected - awarding XP after transaction submission')
        try {
          await addBonusXP(address, 'flip', playerWon)
          const xpEarned = playerWon ? 10 + 500 : 10
          console.log(`✅ XP added successfully in Farcaster mode: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
        
        return { 
          txHash, 
          playerChoice: selectedSide, 
          result: actualResult, 
          isWin: playerWon,
          xpEarned: playerWon ? 510 : 10
        }
      }
      
      // For regular web (non-Farcaster), wait for confirmation
      console.log('⏳ Non-Farcaster mode - waiting for blockchain confirmation...')
      try {
        const receipt = await Promise.race([
          waitForTransactionReceipt(config, {
            hash: txHash,
            confirmations: 1,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction confirmation timeout')), 30000)
          )
        ])
        
        console.log('✅ Transaction confirmed!', receipt)
        
        try {
          await addBonusXP(address, 'flip', playerWon)
          const xpEarned = playerWon ? 10 + 500 : 10
          console.log(`✅ XP added after confirmation: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
      } catch (confirmError) {
        console.warn('⚠️ Confirmation failed, but transaction was sent:', confirmError.message)
        // Still award XP since transaction was submitted successfully
        try {
          await addBonusXP(address, 'flip', playerWon)
          const xpEarned = playerWon ? 10 + 500 : 10
          console.log(`✅ XP added despite confirmation timeout: ${xpEarned}`)
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
      }
      
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
      
      console.log('📡 Sending Lucky Number transaction to blockchain...')
      
      // Send transaction to blockchain
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
      
      console.log('✅ Lucky Number transaction sent! Hash:', txHash)
      
      // Generate game result immediately after transaction submission
      const winningNumber = Math.floor(Math.random() * 10) + 1
      const playerWon = guess === winningNumber
      
      console.log('🎲 Lucky Number result:', { guess, winningNumber, playerWon })
      
      // In Farcaster environment, award XP immediately after transaction submission
      if (isInFarcaster) {
        console.log('🎯 Farcaster detected - awarding XP after transaction submission')
        try {
          await addBonusXP(address, 'luckynumber', playerWon)
          const xpEarned = playerWon ? 10 + 1000 : 10
          console.log(`✅ XP added successfully in Farcaster mode: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
        
        return { 
          txHash, 
          playerGuess: guess, 
          winningNumber, 
          isWin: playerWon,
          xpEarned: playerWon ? 1010 : 10
        }
      }
      
      // For regular web, try confirmation with timeout fallback
      try {
        await Promise.race([
          waitForTransactionReceipt(config, { hash: txHash, confirmations: 1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
        ])
        console.log('✅ Transaction confirmed!')
      } catch (error) {
        console.warn('⚠️ Confirmation timeout, but awarding XP anyway:', error.message)
      }
      
      try {
        await addBonusXP(address, 'luckynumber', playerWon)
        const xpEarned = playerWon ? 10 + 1000 : 10
        console.log(`✅ XP added: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
      } catch (xpError) {
        console.error('Error adding XP:', xpError)
      }
      
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
      
      console.log('📡 Sending Dice Roll transaction to blockchain...')
      
      // Send transaction to blockchain
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
      
      console.log('✅ Dice Roll transaction sent! Hash:', txHash)
      
      // Generate game result immediately after transaction submission
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      const diceTotal = dice1 + dice2
      const playerWon = guess === diceTotal
      
      console.log('🎲 Dice Roll result:', { guess, dice1, dice2, diceTotal, playerWon })
      
      // In Farcaster environment, award XP immediately after transaction submission
      if (isInFarcaster) {
        console.log('🎯 Farcaster detected - awarding XP after transaction submission')
        try {
          await addBonusXP(address, 'diceroll', playerWon)
          const xpEarned = playerWon ? 10 + 1500 : 10
          console.log(`✅ XP added successfully in Farcaster mode: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
        } catch (xpError) {
          console.error('Error adding XP:', xpError)
        }
        
        return { 
          txHash, 
          playerGuess: guess, 
          dice1,
          dice2,
          diceTotal, 
          isWin: playerWon,
          xpEarned: playerWon ? 1510 : 10
        }
      }
      
      // For regular web, try confirmation with timeout fallback
      try {
        await Promise.race([
          waitForTransactionReceipt(config, { hash: txHash, confirmations: 1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
        ])
        console.log('✅ Transaction confirmed!')
      } catch (error) {
        console.warn('⚠️ Confirmation timeout, but awarding XP anyway:', error.message)
      }
      
      try {
        await addBonusXP(address, 'diceroll', playerWon)
        const xpEarned = playerWon ? 10 + 1500 : 10
        console.log(`✅ XP added: ${xpEarned} (${playerWon ? 'WIN' : 'LOSS'})`)
      } catch (xpError) {
        console.error('Error adding XP:', xpError)
      }
      
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
