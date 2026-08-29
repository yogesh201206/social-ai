import { Link } from 'react-router-dom'
import { Plus, Mail, Send, Eye, MousePointerClick, TrendingUp } from 'lucide-react'
import Button from '../../components/Button'
import StatCard from '../../components/StatCard'
import EmailCampaigns from './EmailCampaigns'
import { useEmailMarketing } from '../../context/EmailMarketingContext'

export default function EmailMarketing() {
  const { stats } = useEmailMarketing()

  const dashboardStatCards = [
    {
      label: 'Total Campaigns',
      value: String(stats.totalCampaigns || 0),
      growth: stats.totalCampaigns > 0 ? '+12%' : '0%',
      icon: 'Mail',
      color: 'brand',
    },
    {
      label: 'Emails Sent',
      value: stats.emailsSent || '0',
      growth: stats.emailsSent !== '0' ? '+18.4%' : '0%',
      icon: 'Send',
      color: 'indigo',
    },
    {
      label: 'Open Rate',
      value: stats.openRate || '0%',
      growth: stats.openRate !== '0%' ? '+4.2%' : '0%',
      icon: 'Eye',
      color: 'purple',
    },
    {
      label: 'Click Rate',
      value: stats.clickRate || '0%',
      growth: stats.clickRate !== '0%' ? '+2.8%' : '0%',
      icon: 'TrendingUp',
      color: 'accent',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Marketing</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create, schedule and track email campaigns for your customers.
          </p>
        </div>
        <Link to="/dashboard/email-marketing/create">
          <Button variant="primary" size="md" className="shadow-lg shadow-brand-500/25">
            <Plus className="h-5 w-5" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {dashboardStatCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Main Campaign List Section */}
      <EmailCampaigns />
    </div>
  )
}
