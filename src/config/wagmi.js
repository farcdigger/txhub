import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

// Simple Wagmi config for Farcaster-only app
export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    // Only Farcaster Mini App connector for dedicated Mini App
    farcasterMiniApp(),
  ],
})

console.log('✅ Wagmi configured for Farcaster-only Mini App')