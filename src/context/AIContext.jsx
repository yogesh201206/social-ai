import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { aiHistory as initialHistory } from '../data/aiHistory'
import { generateAIContent } from '../data/aiResponses'

const AIContext = createContext()

export function AIProvider({ children }) {
  const [history, setHistory] = useState(initialHistory)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m your AI Marketing Assistant. Ask me to create posts, captions, hashtags, or marketing ideas for your restaurant. Try: "Create a Diwali offer post for my cafe"',
      timestamp: new Date().toISOString(),
    },
  ])

  const addToHistory = useCallback((entry) => {
    const newEntry = {
      ...entry,
      id: `ai-${Date.now()}`,
      generatedAt: entry.generatedAt || new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    }
    setHistory((prev) => [newEntry, ...prev])
    return newEntry
  }, [])

  const deleteFromHistory = useCallback((id) => {
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const getHistoryItem = useCallback(
    (id) => history.find((h) => h.id === id),
    [history]
  )

  const generate = useCallback((input, generationType = 'full') => {
    return generateAIContent(input, generationType)
  }, [])

  const addChatMessage = useCallback((message) => {
    setChatMessages((prev) => [...prev, message])
  }, [])

  const clearChat = useCallback(() => {
    setChatMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Chat cleared. How can I help you with your restaurant marketing today?',
        timestamp: new Date().toISOString(),
      },
    ])
  }, [])

  const stats = useMemo(() => {
    const captionCount = history.filter((h) =>
      h.contentType?.includes('Caption') || h.contentType === 'Social Media Caption'
    ).length
    const savedCount = history.length
    const typeCounts = history.reduce((acc, h) => {
      const type = h.contentType || 'Other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    const mostUsed = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]

    return {
      totalGenerations: history.length,
      totalCaptions: captionCount,
      savedContent: savedCount,
      mostUsedType: mostUsed ? mostUsed[0] : 'Social Media Caption',
      mostUsedCount: mostUsed ? mostUsed[1] : 0,
    }
  }, [history])

  return (
    <AIContext.Provider
      value={{
        history,
        chatMessages,
        stats,
        addToHistory,
        deleteFromHistory,
        getHistoryItem,
        generate,
        addChatMessage,
        clearChat,
        setChatMessages,
      }}
    >
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within AIProvider')
  }
  return context
}
