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
        
        // Force Farcaster mode for Farcaster-only app
        console.log('Forcing Farcaster mode for Farcaster-only app')
        setIsInFarcaster(true)

        // Try to get user context if available
        try {
          const userContext = await sdk.context.getUser()
          setUser(userContext)
          console.log('✅ User context loaded:', userContext)
        } catch (userError) {
          console.log('⚠️ User context not available (this is normal in some cases):', userError.message)
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

  // Call ready() when interface is fully loaded - Farcaster Only
  useEffect(() => {
    const callReady = async () => {
      if (isInitialized) {
        try {
          console.log('🚀 Attempting to call sdk.actions.ready()...')
          
          // Wait for DOM to be fully ready
          if (document.readyState === 'loading') {
            console.log('⏳ DOM still loading, waiting for DOMContentLoaded...')
            await new Promise(resolve => {
              document.addEventListener('DOMContentLoaded', resolve)
            })
          }
          
          // Wait for React components to be fully rendered
          console.log('⏳ Waiting for React components to render...')
          await new Promise(resolve => setTimeout(resolve, 800))
          
          // Call ready to hide splash screen
          console.log('📞 Calling sdk.actions.ready()...')
          await sdk.actions.ready()
          console.log('✅ Farcaster splash screen hidden - interface is ready!')
        } catch (err) {
          console.error('❌ Failed to call ready:', err)
          // Try again after a delay
          setTimeout(async () => {
            try {
              console.log('🔄 Retrying sdk.actions.ready()...')
              await sdk.actions.ready()
              console.log('✅ Retry successful!')
            } catch (retryErr) {
              console.error('❌ Retry failed:', retryErr)
            }
          }, 1500)
        }
      }
    }

    // Call ready after a short delay to ensure all components are rendered
    const timer = setTimeout(callReady, 500)
    return () => clearTimeout(timer)
  }, [isInitialized])

  // Additional ready() call as backup
  useEffect(() => {
    if (isInitialized) {
      const backupTimer = setTimeout(async () => {
        try {
          console.log('🔄 Backup ready() call...')
          await sdk.actions.ready()
          console.log('✅ Backup ready() call successful!')
        } catch (err) {
          console.error('❌ Backup ready() call failed:', err)
        }
      }, 3000)

      return () => clearTimeout(backupTimer)
    }
  }, [isInitialized])

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
