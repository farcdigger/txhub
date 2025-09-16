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
  const [isInFarcaster, setIsInFarcaster] = useState(true) // Force true for Farcaster-only app
  const [error, setError] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        console.log('🚀 Initializing Farcaster-only Mini App...')
        
        // Force Farcaster mode for dedicated Mini App
        console.log('✅ Farcaster mode enabled (dedicated Mini App)')
        
        // Wait for DOM to be ready first
        if (document.readyState === 'loading') {
          await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve)
          })
        }
        
        console.log('📋 DOM ready, initializing SDK...')
        
        // Try to get user context (don't fail if not available)
        try {
          const userContext = await sdk.context.getUser()
          setUser(userContext)
          console.log('✅ User context loaded:', userContext)
        } catch (userError) {
          console.log('ℹ️ User context not available (normal in some environments)')
        }

        setIsInitialized(true)
        console.log('✅ Farcaster context initialized successfully')
        
      } catch (err) {
        console.error('❌ Failed to initialize Farcaster SDK:', err)
        setError(err.message)
        setIsInitialized(true) // Continue anyway
      }
    }

    initializeFarcaster()
  }, [])

  // Call ready() properly according to Farcaster docs
  useEffect(() => {
    let timeoutId
    
    const callReady = async () => {
      if (isInitialized && !isReady) {
        try {
          console.log('⏳ Waiting for app to be fully loaded...')
          
          // Wait for all resources to load
          await new Promise(resolve => {
            if (document.readyState === 'complete') {
              resolve()
            } else {
              window.addEventListener('load', resolve, { once: true })
            }
          })
          
          // Additional small delay for React hydration
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          console.log('📞 Calling sdk.actions.ready() to hide splash screen...')
          await sdk.actions.ready()
          setIsReady(true)
          console.log('✅ Splash screen hidden - Mini App is ready!')
          
        } catch (err) {
          console.error('❌ Failed to call ready():', err)
          
          // Fallback: try again after longer delay
          timeoutId = setTimeout(async () => {
            try {
              console.log('🔄 Fallback: Calling ready() again...')
              await sdk.actions.ready()
              setIsReady(true)
              console.log('✅ Fallback ready() successful!')
            } catch (retryErr) {
              console.error('❌ Fallback ready() failed:', retryErr)
              // Set ready to true anyway to prevent infinite loading
              setIsReady(true)
            }
          }, 2000)
        }
      }
    }

    callReady()
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isInitialized, isReady])

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
    isReady,
    user,
    isInFarcaster,
    error,
    sendTransaction,
    sendNotification,
    sdk,
  }

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  )
}
