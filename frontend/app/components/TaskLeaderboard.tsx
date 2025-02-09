"use client"

import { useState, useEffect } from 'react'
import { API_BASE_URL } from '@/lib/config'

interface AgentStats {
  project_id: string
  agent_id: string
  unique_count: number
  duplicated_count: number
  disputed_count: number
}

export function TaskLeaderboard({ taskId }: { taskId: string }) {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [stats, setStats] = useState<AgentStats[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/statistics`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: AgentStats[] = await response.json()
      
      // Filter stats for current project and sort by unique_count in descending order
      const projectStats = data
        .filter(stat => stat.project_id === taskId)
        .sort((a, b) => b.unique_count - a.unique_count)
      
      setStats(projectStats)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats when component mounts or taskId changes
  useEffect(() => {
    fetchStats()
  }, [taskId])

  return (
    <div className="mt-4">
      <button
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        className="border border-amber-300 text-amber-700 hover:text-amber-900 hover:bg-amber-50 text-sm px-4 py-2 rounded-md transition-colors flex items-center gap-2"
      >
        {showLeaderboard ? '↑ Hide' : '↓ Show'} Leaderboard
      </button>

      {loading && (
        <div className="mt-2 text-amber-700">Loading statistics...</div>
      )}

      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}

      {showLeaderboard && stats.length > 0 && (
        <div className="mt-4 border border-amber-200 rounded-lg overflow-hidden">
          <div className="bg-amber-100 px-4 py-3 border-b border-amber-200">
            <h3 className="text-base font-bold text-amber-900">🏆 Leaderboard</h3>
          </div>
          <div className="divide-y divide-amber-100">
            {stats.map((stat, index) => (
              <div 
                key={stat.agent_id} 
                className={`grid grid-cols-3 items-center px-4 py-3 ${index === 0 ? 'bg-amber-50' : 'bg-white'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-amber-500 font-bold text-base">{index + 1}</span>
                  <div className="text-base font-bold text-amber-900">
                    {stat.agent_id}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-amber-700 font-bold text-base">
                    {stat.unique_count}
                  </span>
                  <span className="text-amber-600 text-base ml-1 font-bold">
                    finding{stat.unique_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-end">
                  {index === 0 && (
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                      Top Contributor
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showLeaderboard && stats.length === 0 && !loading && (
        <div className="mt-4 text-center p-6 border border-amber-200 rounded-lg bg-white">
          <div className="text-amber-400 text-2xl mb-2">🏆</div>
          <div className="text-amber-900 font-medium">No Contributions Yet</div>
          <div className="text-amber-600 text-sm mt-1">Be the first to contribute!</div>
        </div>
      )}
    </div>
  )
}