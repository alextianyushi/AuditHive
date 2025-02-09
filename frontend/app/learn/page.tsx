'use client'

import { MessageCircle, Book, Send, Sparkles } from "lucide-react"
import { useState } from "react"
import { API_BASE_URL } from '@/lib/config'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function LearnMore() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query: userMessage })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionClick = (question: string) => {
    setInput(question)
    handleSend()
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center bg-white bg-opacity-80 p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-amber-900 mb-4">Learn About AuditHive</h1>
        <p className="text-xl text-amber-800 mb-6">Your Guide to Auditing Corporation Plafform</p>
        <p className="text-amber-800 max-w-3xl mx-auto">
          Get to know how Arbiter in AuditHive helps maintain high standards in security audits through automated processing,
          smart deduplication, and quality evaluation. Ask questions and learn best practices before submitting your work.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Suggested Topics */}
        <div className="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <Book className="w-5 h-5" />
            Learning Topics
          </h2>
          <div className="space-y-4">
            <TopicSection
              title="Getting Started"
              questions={[
                "I'm new here, can you introduce AuditHive to me?"
              ]}
              onQuestionClick={handleQuestionClick}
            />
            <TopicSection
              title="Audit Reports"
              questions={[
                "What is the auditing report format?",
                "What makes a good security finding?"
              ]}
              onQuestionClick={handleQuestionClick}
            />
            <TopicSection
              title="Security and Efficiency"
              questions={[
                "How transparent and decentralized is AuditHive?",
                "How to confirm the integrity of Arbiter agent?",
                "How does AuditHive improve audit efficiency?"
              ]}
              onQuestionClick={handleQuestionClick}
            />
          </div>
        </div>

        {/* Middle and Right Columns: Chat Interface */}
        <div className="md:col-span-2 bg-white bg-opacity-80 p-6 rounded-lg shadow-lg flex flex-col">
          <div className="flex-1 min-h-[500px] mb-4 bg-amber-50 rounded-lg p-4 overflow-y-auto">
            {/* Welcome Message */}
            <div className="bg-amber-100 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-amber-600 mt-1" />
                <div>
                  <p className="font-medium text-amber-900">Welcome to Learning Hub!</p>
                  <p className="text-amber-800 mt-2">
                    I'm here to help you understand how Arbiter works and how to make the most of AuditHive platform.
                    Feel free to ask any questions.
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                }`}
              >
                <div
                  className={`rounded-lg p-4 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-amber-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white text-amber-900 rounded-lg p-4">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about Arbiter..."
              className="flex-1 p-3 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-amber-500 text-white p-3 rounded-lg hover:bg-amber-600 transition-colors disabled:bg-amber-300"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TopicSection({ 
  title, 
  questions, 
  onQuestionClick 
}: { 
  title: string
  questions: string[]
  onQuestionClick: (question: string) => void
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-amber-900">{title}</h3>
      <ul className="space-y-2">
        {questions.map((question, index) => (
          <li key={index}>
            <button
              onClick={() => onQuestionClick(question)}
              className="text-left text-amber-700 hover:text-amber-900 hover:bg-amber-50 p-2 rounded-lg w-full transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{question}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
} 