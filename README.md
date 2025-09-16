# 🎮 BaseHub - Farcaster Mini App

A comprehensive gaming platform built for the Farcaster ecosystem that allows users to play games and earn XP on the Base network. This app works both within Farcaster and as a standalone web application.

## ✨ Features

### 🎯 Games Available
- **GM Game**: Send Good Morning messages and earn XP
- **GN Game**: Send Good Night messages and earn XP  
- **Coin Flip**: Bet on heads or tails with real Base network transactions
- **Lucky Number**: Guess numbers 1-10 and win tokens
- **Dice Roll**: Roll dice and win tokens

### 🔗 Farcaster Integration
- **Farcaster SDK**: Full integration with [Farcaster Mini Apps SDK](https://miniapps.farcaster.xyz/)
- **Wallet Integration**: Seamless wallet connection within Farcaster
- **Notifications**: Send notifications to users about game results
- **Social Features**: Leverage Farcaster's social data and user context

### 🌐 Base Network Support
- **Base Mainnet**: Full support for Base mainnet (Chain ID: 8453)
- **Base Sepolia**: Development support for Base Sepolia testnet
- **Smart Contracts**: Ready for 5+ different game contracts
- **Transaction History**: View all transactions on BaseScan

### 🎨 User Experience
- **Responsive Design**: Works on mobile and desktop
- **Real-time Updates**: Live transaction status and game results
- **Network Detection**: Automatic Base network switching
- **Error Handling**: Comprehensive error messages and recovery

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet (for web usage)
- Farcaster account (for Mini App usage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd basehub-farcaster-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Web: `http://localhost:5173`
   - Farcaster: Use the Mini App URL in Farcaster client

## 🏗️ Architecture

### Core Components

#### Farcaster Integration
- **FarcasterContext**: Manages Farcaster SDK initialization and user context
- **useFarcaster**: Hook for accessing Farcaster features
- **Manifest**: Farcaster Mini App configuration

#### Wallet Management
- **useWallet**: Unified wallet hook for both Farcaster and web3
- **Network Detection**: Automatic Base network detection and switching
- **Balance Tracking**: Real-time balance updates

#### Transaction System
- **useTransactions**: Hook for Base network transactions
- **Game Contracts**: Individual hooks for each game type
- **Error Handling**: Comprehensive transaction error management

### File Structure
```
src/
├── components/
│   └── Header.jsx              # Navigation with Farcaster status
├── contexts/
│   └── FarcasterContext.jsx    # Farcaster SDK integration
├── hooks/
│   ├── useWallet.js           # Wallet management
│   └── useTransactions.js     # Transaction handling
├── pages/
│   ├── Home.jsx               # Game selection
│   ├── GMGame.jsx             # GM game with transactions
│   ├── GNGame.jsx             # GN game with transactions
│   ├── FlipGame.jsx           # Coin flip with betting
│   ├── SlothGame.jsx          # Patience-based rewards
│   └── ContractGame.jsx       # Custom contract interaction
├── config/
│   └── base.js                # Base network configuration
└── styles/
    └── index.css              # Responsive styling
```

## 🔧 Configuration

### Base Network Setup
The app automatically detects and configures Base network:

```javascript
// Base Mainnet Configuration
export const BASE_CONFIG = {
  chainId: 8453,
  chainName: 'Base',
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
  // ... more config
}
```

### Smart Contract Addresses
Contract addresses are configured in `src/config/base.js`:

```javascript
export const CONTRACT_ADDRESSES = {
  GM_GAME: '0x...',           // GM game contract
  GN_GAME: '0x...',           // GN game contract
  FLIP_GAME: '0x...',         // Coin flip contract
  SLOTH_GAME: '0x...',        // Sloth game contract
  TOKEN_CONTRACT: '0x...',    // Token contract
}
```

## 🎮 Game Mechanics

### GM/GN Games
- Send messages to earn XP
- 10 XP per message sent
- Real Base network transactions
- Farcaster notifications on success

### Coin Flip Game
- Bet tokens on heads or tails
- 1.8x return on winning bets
- House edge: 10%
- Real-time game history

### Lucky Number & Dice Roll Games
- Guess numbers to win tokens
- Lucky Number: 2 tokens for correct guess
- Dice Roll: 3 tokens for correct guess
- Real Base network transactions

### Contract Game
- Interact with any Base network contract
- Custom function calls
- Parameter support
- Transaction history tracking

## 🔐 Security Features

- **Wallet Validation**: Ensures proper wallet connection
- **Network Verification**: Confirms Base network usage
- **Transaction Signing**: All transactions require user approval
- **Error Boundaries**: Comprehensive error handling
- **Input Validation**: Sanitized user inputs

## 📱 Farcaster Mini App Features

### Manifest Configuration
```json
{
  "name": "BaseHub",
  "description": "Play games and earn XP on Base network",
  "permissions": ["ethereum", "notifications"],
  "supportedChains": [
    {
      "chainId": 8453,
      "name": "Base",
      "rpcUrl": "https://mainnet.base.org"
    }
  ]
}
```

### SDK Integration
- **User Context**: Access to Farcaster user data
- **Wallet Integration**: Seamless wallet connection
- **Notifications**: Send game result notifications
- **Transaction Handling**: Native transaction support

## 🚀 Deployment

### Environment Variables Setup

Before deploying, you need to set up environment variables. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL (REQUIRED)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key (REQUIRED)
- `VITE_BASE_RPC_URL`: Base network RPC URL (default: https://mainnet.base.org)
- `VITE_BASE_CHAIN_ID`: Base chain ID (default: 8453)
- Contract addresses (optional - add when contracts are deployed)

### Vercel Deployment

1. **Fork this repository** to your GitHub account
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set up environment variables in Vercel dashboard
3. **Configure Environment Variables** in Vercel:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
4. **Deploy**: Vercel will automatically deploy on every push

### Manual Deployment

```bash
npm run build
npm run serve
```

### Farcaster Mini App

#### Prerequisites:
1. **Enable Developer Mode** in Farcaster:
   - Go to [https://farcaster.xyz/~/settings/developer-tools](https://farcaster.xyz/~/settings/developer-tools)
   - Toggle on "Developer Mode"

2. **Deploy to Vercel** (or your hosting provider)

3. **Create Mini App Manifest**:
   - Use Farcaster Developer Tools
   - Upload your deployed app URL
   - Configure manifest.json settings

4. **Test in Farcaster**:
   - Preview your mini app
   - Test all features
   - Submit for approval

## 🔮 Future Enhancements

### Planned Features
- **More Games**: Additional game types and mechanics
- **NFT Integration**: NFT rewards and collections
- **Leaderboards**: Global and friend leaderboards
- **Tournaments**: Scheduled gaming tournaments
- **Social Features**: Share achievements and results

### Smart Contract Development
- **Token Contract**: ERC-20 token for rewards
- **Game Contracts**: Individual contracts for each game
- **Governance**: DAO governance for game parameters
- **Staking**: Token staking mechanisms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Farcaster Mini Apps**: [https://miniapps.farcaster.xyz/](https://miniapps.farcaster.xyz/)
- **Base Network**: [https://base.org/](https://base.org/)
- **BaseScan**: [https://basescan.org/](https://basescan.org/)

## 📞 Support

For support and questions:
- Create an issue in this repository
- Join our Discord community
- Follow us on Farcaster

---

**Built with ❤️ for the Farcaster and Base communities**
