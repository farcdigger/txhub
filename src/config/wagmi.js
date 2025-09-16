import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Create Wagmi config with multiple connectors
export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [
    // Farcaster Mini App connector (priority for Farcaster)
    miniAppConnector(),
    // Web3 connectors for web usage
    injected(),
    metaMask(),
    // Only add WalletConnect if project ID is provided
    ...(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID && import.meta.env.VITE_WALLETCONNECT_PROJECT_ID !== 'your-project-id' 
      ? [walletConnect({
          projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
        })]
      : []
    ),
  ],
})

// Helper function to detect if we're in Farcaster
export const isInFarcaster = () => {
  return typeof window !== 'undefined' && 
         (window.location.href.includes('farcaster') || 
          window.navigator.userAgent.includes('Farcaster'))
}

// Get the appropriate connector based on environment
export const getPreferredConnector = (connectors) => {
  if (isInFarcaster()) {
    // In Farcaster, prefer the Mini App connector
    return connectors.find(connector => connector.id === 'farcasterMiniApp') || connectors[0]
  } else {
    // In web, prefer MetaMask or injected
    return connectors.find(connector => 
      connector.id === 'metaMask' || 
      connector.id === 'injected'
    ) || connectors[0]
  }
}
