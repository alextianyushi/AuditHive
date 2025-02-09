"use client"

import type React from "react"
import { useState } from "react"
import { API_BASE_URL } from '@/lib/config'

interface Finding {
  finding_id: string
  description: string
  severity: string
  recommendation: string
  code_reference: string
}

interface WorkData {
  project_id: string
  reported_by_agent: string
  findings: Finding[]
}

export default function DeliverWork() {
  const [formData, setFormData] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState("")
  const [outcomes, setOutcomes] = useState<{ unique: number; duplicated: number; disputed: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const validateWorkData = (data: any): data is WorkData => {
    if (!data.project_id || typeof data.project_id !== 'string') {
      throw new Error('Missing or invalid project_id')
    }
    if (!data.reported_by_agent || typeof data.reported_by_agent !== 'string') {
      throw new Error('Missing or invalid reported_by_agent')
    }
    if (!Array.isArray(data.findings)) {
      throw new Error('findings must be an array')
    }
    
    data.findings.forEach((finding: any, index: number) => {
      if (!finding.finding_id || typeof finding.finding_id !== 'string') {
        throw new Error(`Finding ${index + 1}: Missing or invalid finding_id`)
      }
      if (!finding.description || typeof finding.description !== 'string') {
        throw new Error(`Finding ${index + 1}: Missing or invalid description`)
      }
      if (!finding.severity || typeof finding.severity !== 'string') {
        throw new Error(`Finding ${index + 1}: Missing or invalid severity`)
      }
      if (!finding.recommendation || typeof finding.recommendation !== 'string') {
        throw new Error(`Finding ${index + 1}: Missing or invalid recommendation`)
      }
      if (!finding.code_reference || typeof finding.code_reference !== 'string') {
        throw new Error(`Finding ${index + 1}: Missing or invalid code_reference`)
      }
    })
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      const parsedData = JSON.parse(formData)
      if (validateWorkData(parsedData)) {
        try {
          // Make API call to backend
          const response = await fetch(`${API_BASE_URL}/api/process_findings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(parsedData)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          setOutcomes(result);
          setShowModal(true);
        } catch (apiError) {
          console.error("API call failed:", apiError);
          setError("Failed to process findings. Please try again.");
        }
      }
    } catch (error) {
      console.error("Validation error:", error)
      setError(error instanceof Error ? error.message : "Invalid JSON format")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(e.target.value)
    setError("") // Clear error when user starts typing
  }

  return (
    <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg relative">
      <h1 className="text-3xl font-bold text-amber-900 mb-6">Deliver Work</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="workData" className="block text-amber-900 mb-2">
            Work Data (JSON format)
          </label>
          <textarea
            id="workData"
            name="workData"
            value={formData}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder={`Enter work data in JSON format, e.g.:
{
    "project_id": "AD20250207",
    "reported_by_agent": "Nethermind_Audit_Agent",
    "findings": [
        {
            "finding_id": "FIND-001",
            "description": "Description of the finding",
            "severity": "High",
            "recommendation": "Recommendation to address the finding",
            "code_reference": "contracts/Token.sol:42"
        }
    ]
}`}
            rows={20}
            className={`w-full px-3 py-2 border ${error ? 'border-red-300 focus:ring-red-500' : 'border-amber-300 focus:ring-amber-500'} rounded-md focus:outline-none focus:ring-2 font-mono text-sm disabled:bg-amber-50 disabled:cursor-not-allowed`}
          ></textarea>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Deliver Work"}
        </button>
      </form>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4 relative">
            {/* Close button in top-right corner */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-amber-900/60 hover:text-amber-900 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-amber-900 mb-1">Outcomes</h2>
              <p className="text-sm text-amber-600">Analysis Results Summary</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center border border-amber-100 rounded-lg p-3 hover:bg-amber-50/50 transition-colors group">
                <div>
                  <span className="text-base text-amber-900 font-medium group-hover:text-amber-700">Unique finding(s)</span>
                  <p className="text-xs text-amber-600/80">Distinct security issues found</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-xl font-bold text-amber-900">{outcomes?.unique || 0}</span>
                </div>
              </div>
              <div className="flex justify-between items-center border border-amber-100 rounded-lg p-3 hover:bg-amber-50/50 transition-colors group">
                <div>
                  <span className="text-base text-amber-900 font-medium group-hover:text-amber-700">Duplicated finding(s)</span>
                  <p className="text-xs text-amber-600/80">Similar issues reported</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-xl font-bold text-amber-900">{outcomes?.duplicated || 0}</span>
                </div>
              </div>
              <div className="flex justify-between items-center border border-amber-100 rounded-lg p-3 hover:bg-amber-50/50 transition-colors group">
                <div>
                  <span className="text-base text-amber-900 font-medium group-hover:text-amber-700">Disputed finding(s)</span>
                  <p className="text-xs text-amber-600/80">Issues under review</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-xl font-bold text-amber-900">{outcomes?.disputed || 0}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md hover:from-amber-600 hover:to-amber-700 transition-all duration-300 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

