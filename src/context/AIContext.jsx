import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { generateAIContent } from '../data/aiResponses'
import { useAuth } from './AuthContext'
import aiService from '../services/aiService'

const AIContext = createContext()

export function AIProvider({ children }) {
  const { token } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m your AI Marketing Assistant. Ask me to create posts, captions, hashtags, or marketing ideas for your restaurant. Try: "Create a Diwali offer post for my cafe"',
      timestamp: new Date().toISOString(),
    },
  ])

  useEffect(() => {
    setLoading(true)
    aiService.getHistory()
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map(h => ({
            id: String(h.id),
            restaurantName: h.restaurantName || 'Restaurant',
            contentType: h.contentType || 'Social Media Caption',
            prompt: h.prompt,
            generatedContent: h.generatedContent,
            generatedAt: h.createdAt ? new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
          }))
          setHistory(formatted)
        }
      })
      .catch((err) => {
        console.warn('[AIContext fetch error]:', err.message)
      })
      .finally(() => setLoading(false))
  }, [token])

  const addToHistory = useCallback(async (entry) => {
    try {
      const res = await aiService.saveHistory({
        restaurantId: entry.restaurantId ? Number(entry.restaurantId) : 1,
        contentType: entry.contentType?.includes('Caption') ? 'Caption' : 'Caption',
        prompt: entry.prompt || 'AI Prompt',
        generatedContent: entry.generatedContent || entry.content || '',
      })
      const newEntry = {
        ...entry,
        id: String(res.id),
        generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }
      setHistory((prev) => [newEntry, ...prev])
      return newEntry
    } catch (e) {
      const newEntry = {
        ...entry,
        id: `ai-${Date.now()}`,
        generatedAt: entry.generatedAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }
      setHistory((prev) => [newEntry, ...prev])
      return newEntry
    }
  }, [])

  const deleteFromHistory = useCallback(async (id) => {
    try {
      await aiService.deleteHistory(id)
    } catch (e) {}
    setHistory((prev) => prev.filter((h) => String(h.id) !== String(id)))
  }, [])

  const getHistoryItem = useCallback(
    (id) => history.find((h) => String(h.id) === String(id)),
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
        loading,
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
