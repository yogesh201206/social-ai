import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
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
      content: 'Hi! I\'m your AI Marketing Assistant powered by real AI. Ask me to create posts, captions, hashtags, or marketing ideas for your restaurant. Try: "Create a Diwali offer post for my cafe"',
      timestamp: new Date().toISOString(),
    },
  ])

  // Load history whenever token changes (login/logout)
  useEffect(() => {
    if (!token) {
      // User logged out — clear all AI state immediately
      setHistory([])
      setChatMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hi! I\'m your AI Marketing Assistant. Please log in to start generating content.',
          timestamp: new Date().toISOString(),
        },
      ])
      return
    }

    setLoading(true)
    aiService.getHistory()
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map(h => ({
            id: String(h.id),
            restaurantName: h.restaurantName || 'Restaurant',
            contentType: h.contentType || 'Caption',
            platform: h.platform || null,
            model: h.model || null,
            prompt: h.prompt,
            generatedContent: h.generatedContent,
            // For backward compat with existing components that use caption/content
            caption: h.generatedContent,
            generatedAt: h.createdAt
              ? new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recently',
          }))
          setHistory(formatted)
        }
      })
      .catch((err) => {
        console.warn('[AIContext] Failed to load history:', err.message)
        setHistory([])
      })
      .finally(() => setLoading(false))
  }, [token])

  /**
   * Real AI generation — calls backend which calls Hugging Face.
   * HF_TOKEN NEVER reaches the browser.
   * History is auto-saved on the backend — no manual saveHistory needed.
   *
   * @param {object} params - { prompt, restaurantId, restaurantName, category, audience, location, contentType, platform }
   * @returns {object} { generatedContent, model, historyId, contentType, platform }
   */
  const generate = useCallback(async (params) => {
    if (!params.prompt || !params.prompt.trim()) {
      throw new Error('Prompt is required')
    }

    const response = await aiService.generate({
      prompt: params.prompt,
      restaurantId: params.restaurantId ? Number(params.restaurantId) : null,
      restaurantName: params.restaurantName || null,
      category: params.category || null,
      audience: params.audience || null,
      location: params.location || null,
      contentType: params.contentType || null,
      platform: params.platform || null,
    })

    // History is auto-saved by backend — just add to local state for immediate display
    const newEntry = {
      id: String(response.historyId),
      restaurantName: params.restaurantName || 'Restaurant',
      contentType: response.contentType || params.contentType || 'Caption',
      platform: response.platform || params.platform || null,
      model: response.model,
      prompt: params.prompt,
      generatedContent: response.generatedContent,
      caption: response.generatedContent,
      generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    setHistory(prev => [newEntry, ...prev])

    return response
  }, [])

  const deleteFromHistory = useCallback(async (id) => {
    try {
      await aiService.deleteHistory(id)
    } catch (e) {
      console.warn('[AIContext] Delete history error:', e.message)
    }
    setHistory(prev => prev.filter(h => String(h.id) !== String(id)))
  }, [])

  const getHistoryItem = useCallback(
    (id) => history.find(h => String(h.id) === String(id)),
    [history]
  )

  const addChatMessage = useCallback((message) => {
    setChatMessages(prev => [...prev, message])
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
    const captionCount = history.filter(h =>
      h.contentType === 'Caption' || h.contentType === 'caption'
    ).length
    const typeCounts = history.reduce((acc, h) => {
      const type = h.contentType || 'Other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    const mostUsed = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]

    return {
      totalGenerations: history.length,
      totalCaptions: captionCount,
      savedContent: history.length,
      mostUsedType: mostUsed ? mostUsed[0] : 'Caption',
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
        generate,
        deleteFromHistory,
        getHistoryItem,
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
