import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import {
  initialOverviewStats,
  timeSeriesData,
  platformPerformanceData,
  followerGrowthMetrics,
  postAnalyticsList,
} from '../data/analyticsData'
import { useRestaurants } from './RestaurantContext'

const AnalyticsContext = createContext()

export function AnalyticsProvider({ children }) {
  const { restaurants } = useRestaurants()

  // Filter state
  const [selectedRestaurant, setSelectedRestaurant] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('30d')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('reach') // 'reach' | 'likes' | 'engagement' | 'engagementRate'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'

  // Reset branch if selected restaurant changes
  const handleSetRestaurant = useCallback((restId) => {
    setSelectedRestaurant(restId)
    setSelectedBranch('all')
  }, [])

  // Available branches for selected restaurant
  const availableBranches = useMemo(() => {
    if (selectedRestaurant === 'all') {
      return restaurants.flatMap((r) => r.branches || [])
    }
    const found = restaurants.find((r) => r.id === selectedRestaurant)
    return found ? found.branches || [] : []
  }, [restaurants, selectedRestaurant])

  // Multiplier for mock data according to selected filters to simulate dynamic real-time data
  const filterMultiplier = useMemo(() => {
    let factor = 1.0
    if (selectedRestaurant !== 'all') {
      factor *= 0.35 // single restaurant share
    }
    if (selectedBranch !== 'all') {
      factor *= 0.45 // single branch share
    }
    if (selectedPlatform !== 'all') {
      factor *= 0.25 // single platform share
    }
    return factor
  }, [selectedRestaurant, selectedBranch, selectedPlatform])

  // Get dynamic timeline data according to date range and multiplier
  const currentTimelineData = useMemo(() => {
    const rawTimeline = timeSeriesData[selectedDateRange] || timeSeriesData['30d']
    return rawTimeline.map((item) => {
      let fLikes = Math.max(10, Math.floor(item.likes * filterMultiplier))
      let fComments = Math.max(2, Math.floor(item.comments * filterMultiplier))
      let fShares = Math.max(1, Math.floor(item.shares * filterMultiplier))
      let fReach = Math.max(100, Math.floor(item.reach * filterMultiplier))
      let fImpressions = Math.max(200, Math.floor(item.impressions * filterMultiplier))

      // Platform specific filter overrides if selectedPlatform is set
      if (selectedPlatform !== 'all') {
        const platName = selectedPlatform.toLowerCase()
        if (platName.includes('instagram')) {
          fLikes = Math.floor(fLikes * 1.5)
        } else if (platName.includes('tiktok')) {
          fLikes = Math.floor(fLikes * 2.2)
          fShares = Math.floor(fShares * 2.5)
        } else if (platName.includes('youtube')) {
          fComments = Math.floor(fComments * 1.8)
        }
      }

      return {
        ...item,
        likes: fLikes,
        comments: fComments,
        shares: fShares,
        reach: fReach,
        impressions: fImpressions,
      }
    })
  }, [selectedDateRange, filterMultiplier, selectedPlatform])

  // Dynamic Overview Stats
  const overviewStats = useMemo(() => {
    const rawReach = Math.round(initialOverviewStats.totalReach.raw * filterMultiplier)
    const rawImp = Math.round(initialOverviewStats.impressions.raw * filterMultiplier)
    const rawEng = Math.round(initialOverviewStats.engagement.raw * filterMultiplier)
    const rawFol = Math.round(initialOverviewStats.followers.raw * (filterMultiplier > 0.5 ? filterMultiplier : filterMultiplier * 1.8))
    const rawPosts = Math.max(1, Math.round(initialOverviewStats.postsPublished.raw * filterMultiplier))

    const formatK = (val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}K` : String(val))

    return {
      totalReach: { ...initialOverviewStats.totalReach, value: formatK(rawReach), raw: rawReach },
      impressions: { ...initialOverviewStats.impressions, value: formatK(rawImp), raw: rawImp },
      engagement: { ...initialOverviewStats.engagement, value: formatK(rawEng), raw: rawEng },
      followers: { ...initialOverviewStats.followers, value: formatK(rawFol), raw: rawFol },
      postsPublished: { ...initialOverviewStats.postsPublished, value: String(rawPosts), raw: rawPosts },
      engagementRate: {
        ...initialOverviewStats.engagementRate,
        value: `${(rawReach > 0 ? ((rawEng / rawReach) * 100).toFixed(1) : 7.6)}%`,
      },
    }
  }, [filterMultiplier])

  // Filtered Platform Performance Data
  const platformData = useMemo(() => {
    return platformPerformanceData.filter((p) => {
      if (selectedPlatform === 'all') return true
      const platLow = p.platform.toLowerCase()
      const selLow = selectedPlatform.toLowerCase()
      return platLow.includes(selLow) || selLow.includes(platLow)
    })
  }, [selectedPlatform])

  // Filtered Post Analytics List
  const filteredPosts = useMemo(() => {
    let result = [...postAnalyticsList]

    if (selectedRestaurant !== 'all') {
      result = result.filter((p) => p.restaurantId === selectedRestaurant)
    }

    if (selectedBranch !== 'all') {
      result = result.filter((p) => p.branchId === selectedBranch)
    }

    if (selectedPlatform !== 'all') {
      const selLow = selectedPlatform.toLowerCase()
      result = result.filter((p) => {
        const platLow = p.platform.toLowerCase()
        return platLow.includes(selLow) || selLow.includes(platLow)
      })
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.caption.toLowerCase().includes(query) ||
          p.restaurantName.toLowerCase().includes(query) ||
          p.platform.toLowerCase().includes(query)
      )
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy]
      let valB = b[sortBy]

      if (sortBy === 'engagementRate') {
        valA = parseFloat(a.engagementRate)
        valB = parseFloat(b.engagementRate)
      }

      if (sortOrder === 'desc') {
        return valB - valA
      } else {
        return valA - valB
      }
    })

    return result
  }, [selectedRestaurant, selectedBranch, selectedPlatform, searchQuery, sortBy, sortOrder])

  // Top 5 Performing Posts
  const topPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => b.engagement - a.engagement).slice(0, 5)
  }, [filteredPosts])

  const getAnalytics = useCallback(() => {
    return {
      overviewStats,
      timelineData: currentTimelineData,
      platformData,
      followerGrowth: followerGrowthMetrics,
      topPosts,
    }
  }, [overviewStats, currentTimelineData, platformData, topPosts])

  const getPlatformAnalytics = useCallback(() => {
    return platformData
  }, [platformData])

  const getPostAnalytics = useCallback(() => {
    return filteredPosts
  }, [filteredPosts])

  const resetFilters = useCallback(() => {
    setSelectedRestaurant('all')
    setSelectedBranch('all')
    setSelectedPlatform('all')
    setSelectedDateRange('30d')
    setSearchQuery('')
    setSortBy('reach')
    setSortOrder('desc')
  }, [])

  return (
    <AnalyticsContext.Provider
      value={{
        selectedRestaurant,
        setSelectedRestaurant: handleSetRestaurant,
        selectedBranch,
        setSelectedBranch,
        selectedPlatform,
        setSelectedPlatform,
        selectedDateRange,
        setSelectedDateRange,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        availableBranches,
        analyticsData: overviewStats,
        platformData,
        postAnalytics: filteredPosts,
        timelineData: currentTimelineData,
        topPosts,
        getAnalytics,
        getPlatformAnalytics,
        getPostAnalytics,
        resetFilters,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider')
  }
  return context
}
