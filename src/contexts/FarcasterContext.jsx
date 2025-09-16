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

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Check if we're running inside Farcaster
        const isInFarcasterApp = await sdk.context.isInFarcaster()
        setIsInFarcaster(isInFarcasterApp)

        if (isInFarcasterApp) {
          // Get user context if available
          try {
            const userContext = await sdk.context.getUser()
            setUser(userContext)
          } catch (userError) {
            console.log('User context not available:', userError)
          }

          // Initialize the SDK
          await sdk.actions.ready()
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
    sdk
  }

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  )
}
