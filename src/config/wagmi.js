import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

// Wagmi config with multiple wallet support
export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    // Farcaster Mini App connector
    farcasterMiniApp(),
    // Other wallet connectors for web
    injected(),
    metaMask(),
  ],
})

console.log('✅ Wagmi configured with multiple wallet support')