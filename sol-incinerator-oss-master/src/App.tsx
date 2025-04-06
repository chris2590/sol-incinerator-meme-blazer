// src/App.tsx
import React, { useState, useEffect } from 'react';
import { 
  Connection, 
  PublicKey, 
  Transaction,
  clusterApiUrl
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  createCloseAccountInstruction 
} from '@solana/spl-token';
import { 
  WalletProvider, 
  ConnectionProvider,
  useWallet,
  useConnection
} from '@solana/wallet-adapter-react';
import { 
  WalletModalProvider, 
  WalletMultiButton 
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  CoinbaseWalletAdapter,
  BraveWalletAdapter,
  ExodusWalletAdapter
} from '@solana/wallet-adapter-wallets';

// CSS imports
import './styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';

// Main App Component
const App: React.FC = () => {
  return (
    <ConnectionProvider endpoint={clusterApiUrl('mainnet-beta')}>
      <WalletProvider wallets={[
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new BackpackWalletAdapter(),
        new CoinbaseWalletAdapter(),
        new BraveWalletAdapter(),
        new ExodusWalletAdapter()
      ]} autoConnect>
        <WalletModalProvider>
          <div className="app-container">
            <Header />
            <MainContent />
            <Footer />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Header Component
const Header: React.FC = () => {
  const { publicKey } = useWallet();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);
  
  return (
    <header className="header">
      <div className="logo-container">
        <img src="/logo.png" alt="MemeBlazer Logo" className="logo" />
        <h1 className="title">Meme Blazer <span className="fire-emoji">🔥</span></h1>
      </div>
      
      {!publicKey && (
        <div className="connect-wallet-container">
          {isMobile ? (
            <MobileWalletConnect />
          ) : (
            <div className="wallet-button-container">
              <WalletMultiButton className="wallet-button" />
            </div>
          )}
        </div>
      )}
      
      {publicKey && (
        <div className="wallet-info">
          <p>Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}</p>
        </div>
      )}
    </header>
  );
};

// Mobile Wallet Connect Component
const MobileWalletConnect: React.FC = () => {
  return (
    <div className="mobile-wallet-connect">
      <h2>Connect Your Mobile Wallet</h2>
      <div className="wallet-buttons">
        <button 
          className="wallet-button phantom-button"
          onClick={() => {
            window.location.href = `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}`;
          }}
        >
          <img src="/phantom-icon.png" alt="Phantom" />
          Phantom
        </button>
        
        <button 
          className="wallet-button solflare-button"
          onClick={() => {
            window.location.href = `https://solflare.com/ul/v1/browse/${encodeURIComponent(window.location.href)}`;
          }}
        >
          <img src="/solflare-icon.png" alt="Solflare" />
          Solflare
        </button>
      </div>
      
      <div className="all-wallets-container">
        <WalletMultiButton className="all-wallets-button">
          <span className="wallet-icon">📱</span> All Wallets
        </WalletMultiButton>
      </div>
      
      <div className="mobile-tips">
        <h3><span className="sparkle">✨</span> Mobile Device Detected</h3>
        <ul>
          <li>Keep app in foreground during transaction</li>
          <li>Tap token cards to see full details</li>
          <li>For best results, burn one token at a time</li>
        </ul>
      </div>
    </div>
  );
};

// Define a type for empty account info
interface EmptyAccount {
  pubkey: string;
  mint: string;
  tokenAmount: number;
}

// Main Content Component
const MainContent: React.FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [emptyAccounts, setEmptyAccounts] = useState<EmptyAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isBrowser, setIsBrowser] = useState({
    isChrome: false,
    isEdge: false,
    isMobile: false
  });
  
  // Detect browser type
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsBrowser({
      isChrome: /chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent),
      isEdge: /edge|edg/i.test(userAgent),
      isMobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    });
  }, []);
  
  // Fetch empty token accounts
  const fetchEmptyAccounts = async () => {
    if (!publicKey) return;
    
    try {
      setIsLoading(true);
      setError("");
      
      // Get all token accounts for the connected wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
      
      // Filter for empty accounts (0 balance)
      const empty = tokenAccounts.value.filter(account => {
        const parsedInfo = account.account.data.parsed.info;
        return parsedInfo.tokenAmount.uiAmount === 0;
      });
      
      setEmptyAccounts(empty.map(account => ({
        pubkey: account.pubkey.toString(),
        mint: account.account.data.parsed.info.mint,
        tokenAmount: account.account.data.parsed.info.tokenAmount.uiAmount
      })));
      
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      setError(`Failed to fetch accounts: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch accounts when wallet connects
  useEffect(() => {
    if (publicKey) {
      fetchEmptyAccounts();
    } else {
      setEmptyAccounts([]);
      setSelectedAccounts([]);
    }
  }, [publicKey, connection]);
  
  // Toggle account selection
  const toggleAccountSelection = (pubkey: string) => {
    if (selectedAccounts.includes(pubkey)) {
      setSelectedAccounts(selectedAccounts.filter(key => key !== pubkey));
    } else {
      setSelectedAccounts([...selectedAccounts, pubkey]);
    }
  };
  
  // Close empty accounts
  const closeEmptyAccounts = async () => {
    if (!publicKey || selectedAccounts.length === 0) {
      setError("Please select accounts to close");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");
      
      // Create transaction
      const transaction = new Transaction();
      
      // Add instructions for each selected account
      for (const account of selectedAccounts) {
        transaction.add(
          createCloseAccountInstruction(
            new PublicKey(account),
            publicKey,
            publicKey,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }
      
      // Browser-specific handling
      if (isBrowser.isChrome) {
        alert("After clicking OK, please check your wallet extension for the transaction approval request.");
      }
      
      if (isBrowser.isMobile) {
        alert("After clicking OK, keep this app open and check your wallet for approval.");
      }
      
      // Send transaction with proper options
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 5
      });
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed on blockchain: ${confirmation.value.err}`);
      }
      
      // Get transaction details to show SOL reclaimed
      const txDetails = await connection.getTransaction(signature, {
        commitment: 'confirmed',
      });
      
      let solReclaimed = 0;
      if (txDetails && txDetails.meta) {
        solReclaimed = txDetails.meta.postBalances[0] - txDetails.meta.preBalances[0];
        solReclaimed = solReclaimed / 1000000000; // Convert lamports to SOL
      }
      
      setSuccess(`Successfully closed ${selectedAccounts.length} accounts! Reclaimed approximately ${solReclaimed.toFixed(6)} SOL`);
      setSelectedAccounts([]);
      fetchEmptyAccounts(); // Refresh the list
      
    } catch (error: any) {
      console.error("Transaction error:", error);
      
      if (error.message.includes("User rejected")) {
        setError("Transaction was rejected in your wallet. Please try again.");
      } else if (error.message.includes("timeout")) {
        setError("Wallet connection timed out. Please keep your wallet app open during the transaction.");
      } else if (isBrowser.isChrome) {
        setError(`Failed to close accounts: ${error.message}. Chrome users: Check your wallet extension icon in the toolbar for pending requests.`);
      } else {
        setError(`Failed to close accounts: ${error.message}. Please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className="main-content">
      {!publicKey ? (
        <div className="connect-prompt">
          <h2>The Ultimate Solana Token Crematorium</h2>
          <p>Connect your wallet to start burning those worthless tokens!</p>
          <img src="/burning-tokens.gif" alt="Burning Tokens" className="burning-gif" />
        </div>
      ) : (
        <div className="account-manager">
          <div className="section-header">
            <h2>Close Empty Accounts</h2>
            <p>Close your empty Solana token accounts to reclaim SOL and clean up your wallet. We'll send 99% of reclaimed SOL back to you, with 1% going to maintain this service.</p>
          </div>
          
          <div className="accounts-container">
            <div className="accounts-header">
              <h3>Empty Token Accounts</h3>
              <button 
                className="refresh-button"
                onClick={fetchEmptyAccounts}
                disabled={isLoading}
              >
                Refresh
              </button>
            </div>
            
            {isLoading ? (
              <div className="loading">
                <p>Loading accounts...</p>
                <div className="spinner"></div>
              </div>
            ) : emptyAccounts.length > 0 ? (
              <div className="accounts-list">
                {emptyAccounts.map(account => (
                  <div 
                    key={account.pubkey}
                    className={`account-item ${selectedAccounts.includes(account.pubkey) ? 'selected' : ''}`}
                    onClick={() => toggleAccountSelection(account.pubkey)}
                  >
                    <div className="account-info">
                      <p className="account-mint">{account.mint.slice(0, 4)}...{account.mint.slice(-4)}</p>
                      <p className="account-balance">Balance: 0</p>
                    </div>
                    <div className="account-checkbox">
                      {selectedAccounts.includes(account.pubkey) ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-accounts">
                <p>No empty token accounts found.</p>
              </div>
            )}
            
            {emptyAccounts.length > 0 && (
              <div className="action-buttons">
                <button 
                  className="close-button"
                  onClick={closeEmptyAccounts}
                  disabled={isLoading || selectedAccounts.length === 0}
                >
                  {isLoading ? 'Processing...' : `Close Selected (${selectedAccounts.length})`}
                </button>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                <h3>Error</h3>
                <p>{error}</p>
                <button className="dismiss-button" onClick={() => setError("")}>Dismiss</button>
              </div>
            )}
            
            {success && (
              <div className="success-message">
                <h3>Accounts Closed Successfully!</h3>
                <p>{success}</p>
                <div className="success-actions">
                  <button className="share-button" onClick={() => window.open(`https://twitter.com/intent/tweet?text=I just burned my worthless tokens with MemeBlazer! 🔥 Check it out at ${window.location.href}`, '_blank')}>
                    Share on Twitter
                  </button>
                  <button className="dismiss-button" onClick={() => setSuccess("")}>Dismiss</button>
                </div>
              </div>
            )}
            
            {isBrowser.isChrome && (
              <div className="browser-notice">
                <p><strong>Chrome Users:</strong> If no wallet popup appears, check your browser toolbar for the wallet extension icon which may be flashing.</p>
              </div>
            )}
            
            {isBrowser.isMobile && (
              <div className="browser-notice">
                <p><strong>Mobile Users:</strong> Keep this app in the foreground during transactions. If you switch apps, the transaction may fail.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

// Footer Component
const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <p>MemeBlazer - The Ultimate Solana Token Crematorium</p>
      <div className="social-links">
        <a href="https://twitter.com/memeblazersol" target="_blank" rel="noopener noreferrer">Twitter</a>
        <a href="https://discord.gg/memeblazersol" target="_blank" rel="noopener noreferrer">Discord</a>
      </div>
    </footer>
  );
};

export default App;
