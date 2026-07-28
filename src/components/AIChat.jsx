import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, Sparkles } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { TypingIndicator } from './LoadingAI'
import { getChatResponse } from '../data/aiResponses'
import { useAI } from '../context/AIContext'

export default function AIChat({ restaurantName = '' }) {
  const { chatMessages, addChatMessage, clearChat } = useAI()
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, typing])

  const handleSend = async (text = input) => {
    const message = text.trim()
    if (!message || typing) return

    addChatMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    })
    setInput('')
    setTyping(true)

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))

    const response = getChatResponse(message, restaurantName)
    addChatMessage({
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    })
    setTyping(false)
  }

  const quickPrompts = [
    'Create a Diwali offer post for my cafe',
    'Suggest hashtags for my restaurant',
    'Write a weekend special caption',
    'Give me a reel idea for Instagram',
  ]

  return (
    <div className="glass rounded-2xl flex flex-col h-[calc(100vh-220px)] min-h-[500px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-bg flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">AI Marketing Assistant</h3>
            <p className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Online
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Clear chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {chatMessages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
        ))}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {chatMessages.length <= 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to create content for your restaurant..."
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="h-12 w-12 rounded-xl gradient-bg text-white flex items-center justify-center shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
