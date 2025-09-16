import React, { createContext, useContext, useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

const FarcasterContext = createContext()

export const useFarcaster = () => {
  const context = useContext(FarcasterContext)
  if (!context) {
    throw new Error('useFarcaster must be used within a FarcasterProvider')
  }
  return context
}

export const FarcasterProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [user, setUser] = useState(null)
  const [isInFarcaster, setIsInFarcaster] = useState(false)
  const [error, setError] = useState(null)
  
  // Manual override for testing (remove in production)
  const [manualFarcasterMode, setManualFarcasterMode] = useState(false)

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Check if we're running inside Farcaster using multiple detection methods
        let isInFarcasterApp = false
        
        // Method 1: Check for Farcaster-specific environment first
        const isInIframe = window.location !== window.parent.location
        const hasFarcasterUA = window.navigator.userAgent.includes('Farcaster') || 
                              window.navigator.userAgent.includes('Warpcast')
        const hasFarcasterURL = window.location.href.includes('farcaster') || 
                               window.location.href.includes('warpcast')
        const hasFarcasterReferrer = document.referrer.includes('farcaster') || 
                                    document.referrer.includes('warpcast')
        
        // If any of these conditions are true, we're likely in Farcaster
        if (isInIframe || hasFarcasterUA || hasFarcasterURL || hasFarcasterReferrer) {
          isInFarcasterApp = true
          console.log('Farcaster detected via environment check')
        } else {
          // Method 2: Try to access Farcaster-specific APIs
          try {
            await sdk.context.getUser()
            isInFarcasterApp = true
            console.log('Farcaster detected via SDK API')
          } catch (e) {
            isInFarcasterApp = false
            console.log('Not in Farcaster environment')
          }
        }
        
        console.log('Farcaster detection result:', isInFarcasterApp)
        
        // Manual override for testing (check URL parameter)
        const urlParams = new URLSearchParams(window.location.search)
        const forceFarcaster = urlParams.get('farcaster') === 'true'
        
        if (forceFarcaster) {
          console.log('Manual Farcaster mode enabled via URL parameter')
          setIsInFarcaster(true)
        } else {
          setIsInFarcaster(isInFarcasterApp)
        }

        if (isInFarcasterApp) {
          // Get user context if available
          try {
            const userContext = await sdk.context.getUser()
            setUser(userContext)
          } catch (userError) {
            console.log('User context not available:', userError)
          }
        }

        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize Farcaster SDK:', err)
        setError(err.message)
        setIsInitialized(true) // Still set to true to allow app to continue
      }
    }

    initializeFarcaster()
  }, [])

  // Separate effect to call ready() when app is fully loaded
  useEffect(() => {
    const callReady = async () => {
      if (isInitialized && isInFarcaster) {
        try {
          // Wait for DOM to be fully ready
          if (document.readyState === 'loading') {
            await new Promise(resolve => {
              document.addEventListener('DOMContentLoaded', resolve)
            })
          }
          
          // Minimal delay to avoid jitter - as per documentation
          await new Promise(resolve => setTimeout(resolve, 100))
          
          await sdk.actions.ready()
          console.log('Farcaster splash screen hidden - app is ready')
        } catch (err) {
          console.error('Failed to call ready:', err)
        }
      }
    }

    callReady()
  }, [isInitialized, isInFarcaster])

  const sendTransaction = async (transaction) => {
    if (!isInFarcaster) {
      throw new Error('Transaction can only be sent from within Farcaster')
    }

    try {
      const result = await sdk.actions.sendTransaction(transaction)
      return result
    } catch (err) {
      console.error('Transaction failed:', err)
      throw err
    }
  }

  const sendNotification = async (notification) => {
    if (!isInFarcaster) {
      console.log('Notifications only work within Farcaster')
      return
    }

    try {
      await sdk.actions.sendNotification(notification)
    } catch (err) {
      console.error('Failed to send notification:', err)
    }
  }

  const value = {
    isInitialized,
    user,
    isInFarcaster,
    error,
    sendTransaction,
    sendNotification,
    sdk,
    // Manual toggle for testing
    toggleFarcasterMode: () => {
      setManualFarcasterMode(!manualFarcasterMode)
      setIsInFarcaster(!isInFarcaster)
    }
  }

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  )
}
