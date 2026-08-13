import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { initialCampaigns } from '../data/emailMarketingData'
import { useNotifications } from './NotificationContext'

const EmailMarketingContext = createContext()

export function EmailMarketingProvider({ children }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const { addNotification } = useNotifications()

  const addCampaign = useCallback((campaignData) => {
    const newId = `emp-${Date.now()}`
    const isScheduled = campaignData.scheduledDate && campaignData.status !== 'Draft'
    const status = campaignData.status || (isScheduled ? 'Scheduled' : 'Draft')
    
    const newCampaign = {
      ...campaignData,
      id: newId,
      status,
      createdDate: campaignData.createdDate || new Date().toISOString().split('T')[0],
      recipients: campaignData.recipients || 1500,
      analytics: campaignData.analytics || {
        sent: status === 'Sent' ? (campaignData.recipients || 1500) : 0,
        delivered: status === 'Sent' ? Math.round((campaignData.recipients || 1500) * 0.98) : 0,
        deliveredRate: status === 'Sent' ? '98.0%' : '0%',
        opened: status === 'Sent' ? Math.round((campaignData.recipients || 1500) * 0.65) : 0,
        openRate: status === 'Sent' ? '65.0%' : '0%',
        clicked: status === 'Sent' ? Math.round((campaignData.recipients || 1500) * 0.22) : 0,
        clickRate: status === 'Sent' ? '22.0%' : '0%',
        bounced: status === 'Sent' ? Math.round((campaignData.recipients || 1500) * 0.02) : 0,
        bounceRate: status === 'Sent' ? '2.0%' : '0%',
        unsubscribed: status === 'Sent' ? Math.round((campaignData.recipients || 1500) * 0.005) : 0,
        unsubscribeRate: status === 'Sent' ? '0.5%' : '0%',
        dailyPerformance: []
      }
    }

    setCampaigns((prev) => [newCampaign, ...prev])

    if (status === 'Scheduled') {
      addNotification({
        title: 'Campaign Scheduled',
        message: `Email campaign "${newCampaign.name}" has been scheduled successfully.`,
        type: 'schedule'
      })
    } else {
      addNotification({
        title: 'Campaign Saved',
        message: `Email campaign "${newCampaign.name}" saved as draft.`,
        type: 'schedule'
      })
    }

    return newCampaign
  }, [addNotification])

  const updateCampaign = useCallback((id, updatedFields) => {
    let updatedObj = null
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedObj = { ...c, ...updatedFields }
          return updatedObj
        }
        return c
      })
    )

    if (updatedObj) {
      addNotification({
        title: 'Campaign Updated',
        message: `Campaign "${updatedObj.name}" updated successfully.`,
        type: 'schedule'
      })
    }
    return updatedObj
  }, [addNotification])

  const deleteCampaign = useCallback((id) => {
    let deletedName = ''
    setCampaigns((prev) => {
      const target = prev.find((c) => c.id === id)
      if (target) deletedName = target.name
      return prev.filter((c) => c.id !== id)
    })

    if (deletedName) {
      addNotification({
        title: 'Campaign Deleted',
        message: `Campaign "${deletedName}" was removed.`,
        type: 'schedule'
      })
    }
  }, [addNotification])

  const duplicateCampaign = useCallback((id) => {
    const target = campaigns.find((c) => c.id === id)
    if (!target) return null

    const duplicate = {
      ...target,
      id: `emp-${Date.now()}`,
      name: `${target.name} (Copy)`,
      status: 'Draft',
      createdDate: new Date().toISOString().split('T')[0],
      analytics: {
        sent: 0,
        delivered: 0,
        deliveredRate: '0%',
        opened: 0,
        openRate: '0%',
        clicked: 0,
        clickRate: '0%',
        bounced: 0,
        bounceRate: '0%',
        unsubscribed: 0,
        unsubscribeRate: '0%',
        dailyPerformance: []
      }
    }

    setCampaigns((prev) => [duplicate, ...prev])

    addNotification({
      title: 'Campaign Duplicated',
      message: `Duplicated "${target.name}" as draft.`,
      type: 'schedule'
    })

    return duplicate
  }, [campaigns, addNotification])

  const scheduleCampaign = useCallback((id, scheduleInfo) => {
    let targetName = ''
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          targetName = c.name
          return {
            ...c,
            ...scheduleInfo,
            status: 'Scheduled'
          }
        }
        return c
      })
    )

    addNotification({
      title: 'Campaign Scheduled',
      message: `Email campaign "${targetName}" scheduled successfully.`,
      type: 'schedule'
    })
  }, [addNotification])

  const getCampaign = useCallback(
    (id) => campaigns.find((c) => c.id === id),
    [campaigns]
  )

  const filterCampaigns = useCallback(
    ({ search = '', restaurantId = '', branchId = '', status = '' } = {}) => {
      return campaigns.filter((c) => {
        const matchesSearch =
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.subject.toLowerCase().includes(search.toLowerCase()) ||
          c.restaurantName.toLowerCase().includes(search.toLowerCase())

        const matchesRestaurant = !restaurantId || c.restaurantId === restaurantId
        const matchesBranch = !branchId || c.branchId === branchId
        const matchesStatus = !status || c.status === status

        return matchesSearch && matchesRestaurant && matchesBranch && matchesStatus
      })
    },
    [campaigns]
  )

  const stats = useMemo(() => {
    const totalCampaigns = campaigns.length
    let totalSent = 0
    let totalOpened = 0
    let totalClicked = 0

    campaigns.forEach((c) => {
      if (c.analytics) {
        totalSent += c.analytics.sent || 0
        totalOpened += c.analytics.opened || 0
        totalClicked += c.analytics.clicked || 0
      }
    })

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) + '%' : '68.4%'
    const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) + '%' : '24.6%'

    const formattedSent =
      totalSent >= 1000 ? `${(totalSent / 1000).toFixed(1)}K` : totalSent > 0 ? totalSent.toString() : '12.8K'

    return {
      totalCampaigns: totalCampaigns || 24,
      emailsSent: formattedSent,
      openRate,
      clickRate,
    }
  }, [campaigns])

  return (
    <EmailMarketingContext.Provider
      value={{
        campaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        duplicateCampaign,
        scheduleCampaign,
        getCampaign,
        filterCampaigns,
        stats,
      }}
    >
      {children}
    </EmailMarketingContext.Provider>
  )
}

export function useEmailMarketing() {
  const context = useContext(EmailMarketingContext)
  if (!context) {
    throw new Error('useEmailMarketing must be used within EmailMarketingProvider')
  }
  return context
}
