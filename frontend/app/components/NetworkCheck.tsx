"use client"

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

const ARBITRUM_SEPOLIA_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || '421614'

export function NetworkCheck() {
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const checkNetwork = async () => {
    if (typeof window.ethereum === 'undefined') {
      setIsChecking(false)
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      setIsWrongNetwork(network.chainId.toString() !== ARBITRUM_SEPOLIA_CHAIN_ID)
    } catch (error) {
      console.error('Error checking network:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const switchNetwork = async () => {
    if (typeof window.ethereum === 'undefined') return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${parseInt(ARBITRUM_SEPOLIA_CHAIN_ID).toString(16)}` }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${parseInt(ARBITRUM_SEPOLIA_CHAIN_ID).toString(16)}`,
                chainName: 'Arbitrum Sepolia',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL],
                blockExplorerUrls: ['https://sepolia.arbiscan.io/']
              },
            ],
          })
        } catch (addError) {
          console.error('Error adding network:', addError)
        }
      }
    }
  }

  useEffect(() => {
    checkNetwork()
    
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('chainChanged', checkNetwork)
      return () => {
        window.ethereum.removeListener('chainChanged', checkNetwork)
      }
    }
  }, [])

  if (isChecking || !isWrongNetwork) return null

  return (
    <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
      <p className="text-red-700 mb-2">Please switch to Arbitrum Sepolia network</p>
      <button
        onClick={switchNetwork}
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
      >
        Switch Network
      </button>
    </div>
  )
} 