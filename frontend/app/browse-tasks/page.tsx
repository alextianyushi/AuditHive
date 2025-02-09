"use client"

import { TaskLeaderboard } from "../components/TaskLeaderboard"
import { useState, useEffect } from "react"
import { ethers } from 'ethers'

const TASK_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_TASK_MANAGER_ADDRESS
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL

const TASK_MANAGER_ABI = [
  "function getAllTasks() external view returns (string[], string[], string[], uint256[], address[], bool[])"
]

interface Task {
  projectId: string
  projectRepo: string
  title: string
  bounty: string
  submitter: string
  isActive: boolean
}

export default function BrowseTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    setError(null)
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const contract = new ethers.Contract(TASK_MANAGER_ADDRESS!, TASK_MANAGER_ABI, provider)
      
      const [ids, titles, repos, bounties, submitters, actives] = await contract.getAllTasks()
      const formattedTasks = ids.map((id: string, index: number) => ({
        projectId: id,
        projectRepo: repos[index],
        title: titles[index],
        bounty: ethers.formatEther(bounties[index]) + " ETH",
        submitter: submitters[index],
        isActive: actives[index]
      }))
      setTasks(formattedTasks)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Failed to load tasks. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    const intervalId = setInterval(fetchTasks, 30000)
    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-amber-900 mb-6">Browse Tasks</h1>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-amber-200 rounded-md p-4 animate-pulse">
              <div className="h-6 bg-amber-100 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-amber-50 rounded w-1/2"></div>
                <div className="h-4 bg-amber-50 rounded w-2/3"></div>
                <div className="h-4 bg-amber-50 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-amber-900 mb-6">Browse Tasks</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchTasks}
            className="mt-4 bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-amber-900 mb-6">Browse Tasks</h1>
      
      {/* Add last update time */}
      {lastUpdate && (
        <p className="text-amber-700 mb-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      <div className="space-y-8">
        {tasks.filter(task => task.isActive).map((task) => (
          <div key={task.projectId} className="border border-amber-200 rounded-md p-4">
            <h2 className="text-xl font-semibold text-amber-900 mb-2">{task.title}</h2>
            <p className="text-amber-800">
              <strong>Project ID:</strong> {task.projectId}
            </p>
            <p className="text-amber-800">
              <strong>Project Repo:</strong> {task.projectRepo}
            </p>
            <p className="text-amber-800">
              <strong>Bounty:</strong> {task.bounty}
            </p>
            <p className="text-amber-800">
              <strong>Submitter:</strong> {task.submitter}
            </p>
            <TaskLeaderboard taskId={task.projectId} />
          </div>
        ))}
      </div>

      {tasks.filter(task => task.isActive).length === 0 && (
        <p className="text-amber-700 text-center mt-8">No active tasks available at the moment.</p>
      )}
    </div>
  )
}

