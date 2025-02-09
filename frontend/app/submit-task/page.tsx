"use client"

import type React from "react"
import { useState } from "react"
import { ethers } from 'ethers'

// 声明全局window类型
declare global {
  interface Window {
    ethereum?: any;
  }
  namespace JSX {
    interface IntrinsicElements {
      label: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
    }
  }
}

// 合约 ABI 和地址
const TASK_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_TASK_MANAGER_ADDRESS

const TASK_MANAGER_ABI = [
  "function submitTask(string memory _projectId, string memory _projectRepo, string memory _title, uint256 _bountyInWei) external payable",
  "function getTask(string memory _projectId) external view returns (string memory projectRepo, uint256 bounty, address submitter, bool isActive)"
]

interface FormError {
  field: string | null;
  message: string;
}

export default function SubmitTask() {
  const [formData, setFormData] = useState({
    projectId: "",
    projectRepo: "",
    title: "",
    bounty: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<FormError | null>(null)
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    if (!formData.projectId.trim()) {
      return { field: 'projectId', message: 'Project ID is required' }
    }
    if (!formData.projectRepo.trim()) {
      return { field: 'projectRepo', message: 'Project Repository URL is required' }
    }
    if (!formData.title.trim()) {
      return { field: 'title', message: 'Task Title is required' }
    }
    if (!formData.bounty || parseFloat(formData.bounty) <= 0) {
      return { field: 'bounty', message: 'Bounty must be greater than 0 ETH' }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    // Form validation
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setIsSubmitting(false)
      return
    }

    try {
      // Check MetaMask installation
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to submit tasks")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Check if user is connected
      try {
        await provider.getSigner()
      } catch {
        throw new Error("Please connect your wallet first")
      }

      // Check network
      const network = await provider.getNetwork()
      const expectedChainId = process.env.NEXT_PUBLIC_CHAIN_ID || '421614'
      if (network.chainId.toString() !== expectedChainId) {
        throw new Error("Please switch to Arbitrum Sepolia network")
      }

      const signer = await provider.getSigner()
      const taskManager = new ethers.Contract(TASK_MANAGER_ADDRESS!, TASK_MANAGER_ABI, signer)

      // Convert ETH to Wei
      const bountyInWei = ethers.parseEther(formData.bounty)

      // Check user balance
      const balance = await provider.getBalance(await signer.getAddress())
      if (balance < bountyInWei) {
        throw new Error("Insufficient balance to submit task with this bounty")
      }

      // Submit task
      console.log("Submitting task...")
      const submitTx = await taskManager.submitTask(
        formData.projectId,
        formData.projectRepo,
        formData.title,
        bountyInWei,
        { value: bountyInWei }
      )

      // Wait for transaction
      const receipt = await submitTx.wait()
      console.log("Task submitted successfully!", receipt)
      
      // Show success message and reset form
      setSuccess(true)
      setFormData({
        projectId: "",
        projectRepo: "",
        title: "",
        bounty: "",
      })
    } catch (err: any) {
      console.error("Error:", err)
      
      // Handle specific error cases
      if (err.message.includes("user rejected")) {
        setError({ field: null, message: "Transaction was rejected in MetaMask" })
      } else if (err.message.includes("insufficient funds")) {
        setError({ field: 'bounty', message: "Insufficient funds to pay for the bounty and gas fees" })
      } else if (err.message.includes("Project ID already exists")) {
        setError({ field: 'projectId', message: "This Project ID is already in use" })
      } else {
        setError({ field: null, message: err.message || "Failed to submit task" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error?.field === name) {
      setError(null)
    }
  }

  const getInputClassName = (fieldName: string) => {
    return `w-full px-3 py-2 border ${
      error?.field === fieldName 
        ? 'border-red-300 focus:ring-red-500' 
        : 'border-amber-300 focus:ring-amber-500'
    } rounded-md focus:outline-none focus:ring-2 ${
      isSubmitting ? 'bg-amber-50 cursor-not-allowed' : ''
    }`
  }

  return (
    <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-amber-900 mb-6">Submit Task</h1>
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">Task submitted successfully! You can view it in the Browse Tasks page.</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
        <div>
          <label htmlFor="title" className="block text-amber-900 mb-2">
            Task Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g., Cross-chain Bridge Auditing"
            className={getInputClassName('title')}
          />
        </div>

        <div>
          <label htmlFor="projectId" className="block text-amber-900 mb-2">
            Project ID
          </label>
          <input
            type="text"
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="Enter unique project ID"
            className={getInputClassName('projectId')}
          />
        </div>

        <div>
          <label htmlFor="projectRepo" className="block text-amber-900 mb-2">
            Project Repository URL
          </label>
          <input
            type="text"
            id="projectRepo"
            name="projectRepo"
            value={formData.projectRepo}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="e.g., https://github.com/username/project"
            className={getInputClassName('projectRepo')}
          />
        </div>

        <div>
          <label htmlFor="bounty" className="block text-amber-900 mb-2">
            Bounty (ETH)
          </label>
          <input
            type="number"
            step="any"
            min="0"
            id="bounty"
            name="bounty"
            value={formData.bounty}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder="Enter ETH amount"
            className={getInputClassName('bounty')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600 transition-colors ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Task'}
        </button>
      </form>
    </div>
  )
}

