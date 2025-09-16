import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

// Track cooldown for different game types
export const useCooldown = (gameType) => {
  const { address } = useAccount()
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [lastPlayTime, setLastPlayTime] = useState(null)
  
  const COOLDOWN_DURATION = 60 // 60 seconds
  
  useEffect(() => {
    if (!address || !gameType) return
    
    // Get last play time from localStorage
    const storageKey = `lastPlay_${gameType}_${address}`
    const lastTime = localStorage.getItem(storageKey)
    
    if (lastTime) {
      const lastPlayTimestamp = parseInt(lastTime)
      setLastPlayTime(lastPlayTimestamp)
      
      const now = Math.floor(Date.now() / 1000)
      const elapsed = now - lastPlayTimestamp
      const remaining = Math.max(0, COOLDOWN_DURATION - elapsed)
      
      setCooldownRemaining(remaining)
    }
  }, [address, gameType])
  
  useEffect(() => {
    if (cooldownRemaining <= 0) return
    
    const interval = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [cooldownRemaining])
  
  const updateLastPlayTime = () => {
    if (!address || !gameType) return
    
    const now = Math.floor(Date.now() / 1000)
    const storageKey = `lastPlay_${gameType}_${address}`
    localStorage.setItem(storageKey, now.toString())
    
    setLastPlayTime(now)
    setCooldownRemaining(COOLDOWN_DURATION)
  }
  
  const canPlay = cooldownRemaining <= 0
  
  const formatTime = (seconds) => {
    if (seconds <= 0) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }
  
  return {
    canPlay,
    cooldownRemaining,
    cooldownText: formatTime(cooldownRemaining),
    updateLastPlayTime,
    lastPlayTime
  }
}
