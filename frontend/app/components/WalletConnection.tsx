"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function WalletConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState("")

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setIsConnected(true)
          setAddress(accounts[0])
        }
      } catch (error) {
        console.error("Failed to get accounts", error)
      }
    }
  }

  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" })
        checkConnection()
      } catch (error) {
        console.error("Failed to connect", error)
      }
    } else {
      alert("MetaMask is not installed!")
    }
  }

  async function disconnectWallet() {
    setIsConnected(false)
    setAddress("")
  }

  return (
    <div>
      {isConnected ? (
        <div className="flex items-center space-x-2">
          <span className="text-amber-900">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
          <Button onClick={disconnectWallet} variant="outline" className="bg-amber-100">
            Disconnect
          </Button>
        </div>
      ) : (
        <Button onClick={connectWallet} variant="outline" className="bg-amber-100">
          Connect Wallet
        </Button>
      )}
    </div>
  )
}

