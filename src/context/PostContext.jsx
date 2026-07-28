import { createContext, useContext, useState, useCallback } from 'react'
import { posts as initialPosts } from '../data/postsData'

const PostContext = createContext()

export function PostProvider({ children }) {
  const [posts, setPosts] = useState(initialPosts)

  const getPost = useCallback((id) => posts.find((p) => p.id === id), [posts])

  const addPost = useCallback((post) => {
    const newPost = {
      ...post,
      id: String(Date.now()),
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: post.status || 'Draft',
      metrics: post.status === 'Published' ? post.metrics || { likes: 0, comments: 0, shares: 0 } : null,
    }
    setPosts((prev) => [newPost, ...prev])
    return newPost
  }, [])

  const updatePost = useCallback((id, updates) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }, [])

  const deletePost = useCallback((id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const cancelSchedule = useCallback((id) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: 'Draft', scheduledDate: null, scheduledTime: null }
          : p
      )
    )
  }, [])

  const getPostsByStatus = useCallback(
    (status) => posts.filter((p) => p.status === status),
    [posts]
  )

  const getRecentPosts = useCallback(
    (limit = 5) => [...posts].slice(0, limit),
    [posts]
  )

  const getPerformanceOverview = useCallback(() => {
    const published = posts.filter((p) => p.status === 'Published' && p.metrics)
    const totalLikes = published.reduce((sum, p) => sum + p.metrics.likes, 0)
    const totalComments = published.reduce((sum, p) => sum + p.metrics.comments, 0)
    const totalShares = published.reduce((sum, p) => sum + p.metrics.shares, 0)
    const avgEngagement = published.length
      ? Math.round((totalLikes + totalComments + totalShares) / published.length)
      : 0
    return { totalLikes, totalComments, totalShares, avgEngagement, publishedCount: published.length }
  }, [posts])

  return (
    <PostContext.Provider
      value={{
        posts,
        getPost,
        addPost,
        updatePost,
        deletePost,
        cancelSchedule,
        getPostsByStatus,
        getRecentPosts,
        getPerformanceOverview,
      }}
    >
      {children}
    </PostContext.Provider>
  )
}

export function usePosts() {
  const context = useContext(PostContext)
  if (!context) {
    throw new Error('usePosts must be used within PostProvider')
  }
  return context
}
