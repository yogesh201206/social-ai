import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import {
  initialOverviewStats,
  timeSeriesData,
  platformPerformanceData,
  followerGrowthMetrics,
  postAnalyticsList,
} from '../data/analyticsData'
import { useAuth } from './AuthContext'
import { useRestaurants } from './RestaurantContext'
import analyticsService from '../services/analyticsService'

const AnalyticsContext = createContext()

export function AnalyticsProvider({ children }) {
  const { token } = useAuth()
  const { restaurants } = useRestaurants()

  // Filter state
  const [selectedRestaurant, setSelectedRestaurant] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('30d')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('reach')
  const [sortOrder, setSortOrder] = useState('desc')
  const [apiOverview, setApiOverview] = useState(null)

  useEffect(() => {
    const params = {}
    if (selectedRestaurant !== 'all') params.restaurantId = selectedRestaurant
    if (selectedBranch !== 'all') params.branchId = selectedBranch
    analyticsService.getOverview(params)
      .then((data) => {
        if (data) setApiOverview(data)
      })
      .catch((e) => {})
  }, [selectedRestaurant, selectedBranch, token])

  const handleSetRestaurant = useCallback((restId) => {
    setSelectedRestaurant(restId)
    setSelectedBranch('all')
  }, [])

  const availableBranches = useMemo(() => {
    if (selectedRestaurant === 'all') {
      return restaurants.flatMap((r) => r.branches || [])
    }
    const found = restaurants.find((r) => String(r.id) === String(selectedRestaurant))
    return found ? found.branches || [] : []
  }, [restaurants, selectedRestaurant])

  const filterMultiplier = useMemo(() => {
    let factor = 1.0
    if (selectedRestaurant !== 'all') factor *= 0.35
    if (selectedBranch !== 'all') factor *= 0.45
    if (selectedPlatform !== 'all') factor *= 0.25
    return factor
  }, [selectedRestaurant, selectedBranch, selectedPlatform])

  const currentTimelineData = useMemo(() => {
    const rawTimeline = timeSeriesData[selectedDateRange] || timeSeriesData['30d']
    return rawTimeline.map((item) => {
      let fLikes = Math.max(10, Math.floor(item.likes * filterMultiplier))
      let fComments = Math.max(2, Math.floor(item.comments * filterMultiplier))
      let fShares = Math.max(1, Math.floor(item.shares * filterMultiplier))
      let fReach = Math.max(100, Math.floor(item.reach * filterMultiplier))
      let fImpressions = Math.max(200, Math.floor(item.impressions * filterMultiplier))

      if (selectedPlatform !== 'all') {
        const platName = selectedPlatform.toLowerCase()
        if (platName.includes('instagram')) fLikes = Math.floor(fLikes * 1.5)
        else if (platName.includes('tiktok')) {
          fLikes = Math.floor(fLikes * 2.2)
          fShares = Math.floor(fShares * 2.5)
        } else if (platName.includes('youtube')) fComments = Math.floor(fComments * 1.8)
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

  const overviewStats = useMemo(() => {
    const baseReach = apiOverview ? (apiOverview.totalReach ?? 0) : 0
    const baseImp = apiOverview ? (apiOverview.totalImpressions ?? 0) : 0
    const baseLikes = apiOverview ? (apiOverview.totalLikes ?? 0) : 0
    const baseComm = apiOverview ? (apiOverview.totalComments ?? 0) : 0
    const baseShares = apiOverview ? (apiOverview.totalShares ?? 0) : 0
    const baseEng = baseLikes + baseComm + baseShares
    const baseFol = apiOverview ? (apiOverview.totalFollowers ?? 0) : 0
    const basePosts = apiOverview ? (apiOverview.totalPosts ?? 0) : 0

    const rawReach = Math.round(baseReach * filterMultiplier)
    const rawImp = Math.round(baseImp * filterMultiplier)
    const rawEng = Math.round(baseEng * filterMultiplier)
    const rawFol = Math.round(baseFol * (filterMultiplier > 0.5 ? filterMultiplier : filterMultiplier * 1.8))
    const rawPosts = Math.round(basePosts * filterMultiplier)

    const formatK = (val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}K` : String(val || 0))

    return {
      totalReach: { ...initialOverviewStats.totalReach, value: formatK(rawReach), raw: rawReach },
      impressions: { ...initialOverviewStats.impressions, value: formatK(rawImp), raw: rawImp },
      engagement: { ...initialOverviewStats.engagement, value: formatK(rawEng), raw: rawEng },
      followers: { ...initialOverviewStats.followers, value: formatK(rawFol), raw: rawFol },
      postsPublished: { ...initialOverviewStats.postsPublished, value: String(rawPosts), raw: rawPosts },
      engagementRate: {
        ...initialOverviewStats.engagementRate,
        value: `${rawReach > 0 ? ((rawEng / rawReach) * 100).toFixed(1) : (apiOverview?.averageEngagementRate ? apiOverview.averageEngagementRate.toFixed(1) : '0.0')}%`,
      },
    }
  }, [filterMultiplier, apiOverview])

  const platformData = useMemo(() => {
    return platformPerformanceData.filter((p) => {
      if (selectedPlatform === 'all') return true
      const platLow = p.platform.toLowerCase()
      const selLow = selectedPlatform.toLowerCase()
      return platLow.includes(selLow) || selLow.includes(platLow)
    })
  }, [selectedPlatform])

  const filteredPosts = useMemo(() => {
    let result = [...postAnalyticsList]

    if (selectedRestaurant !== 'all') {
      result = result.filter((p) => String(p.restaurantId) === String(selectedRestaurant))
    }

    if (selectedBranch !== 'all') {
      result = result.filter((p) => String(p.branchId) === String(selectedBranch))
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
