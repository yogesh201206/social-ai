import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, MapPin, Users, Calendar, Clock, Edit, Copy,
  Trash2, Mail, Send, Eye, MousePointerClick, AlertCircle, CheckCircle,
  TrendingUp, BarChart3, ShieldCheck, XCircle, UserMinus
} from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import StatusBadge from '../../components/StatusBadge'
import StatCard from '../../components/StatCard'
import { useEmailMarketing } from '../../context/EmailMarketingContext'

export default function EmailCampaignDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCampaign, deleteCampaign, duplicateCampaign } = useEmailMarketing()
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const campaign = getCampaign(id)

  if (!campaign) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Campaign Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          The email campaign you are looking for does not exist or has been deleted.
        </p>
        <Link to="/dashboard/email-marketing">
          <Button variant="primary">Return to Campaigns</Button>
        </Link>
      </div>
    )
  }

  const isSent = campaign.status === 'Sent'
  const analytics = campaign.analytics || {
    sent: campaign.recipients || 0,
    delivered: isSent ? (campaign.recipients || 0) : 0,
    deliveredRate: isSent ? '100%' : '0%',
    opened: 0,
    openRate: '0%',
    clicked: 0,
    clickRate: '0%',
    bounced: 0,
    bounceRate: '0%',
    unsubscribed: 0,
    unsubscribeRate: '0%',
  }

  const handleDelete = () => {
    deleteCampaign(campaign.id)
    navigate('/dashboard/email-marketing')
  }

  const handleDuplicate = () => {
    const dup = duplicateCampaign(campaign.id)
    if (dup) navigate(`/dashboard/email-marketing/${dup.id}/edit`)
  }

  const isSentOrPaused = campaign.status === 'Sent' || campaign.status === 'Paused'

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/email-marketing"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.name}</h2>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Subject: &quot;{campaign.subject}&quot;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/dashboard/email-marketing/${campaign.id}/edit`}>
            <Button variant="secondary" size="sm">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={handleDuplicate}>
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* STEP 9 – PERFORMANCE STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">
            <span>Emails Sent</span>
            <Send className="h-4 w-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.sent ? analytics.sent.toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Total recipients targeted</p>
        </div>

        <div className="glass rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">
            <span>Delivered</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.delivered ? analytics.delivered.toLocaleString() : '0'}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {analytics.deliveredRate} Delivery Rate
          </p>
        </div>

        <div className="glass rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">
            <span>Open Rate</span>
            <Eye className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.openRate}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {analytics.opened ? analytics.opened.toLocaleString() : 0} unique opens
          </p>
        </div>

        <div className="glass rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">
            <span>Click Rate</span>
            <MousePointerClick className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.clickRate}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {analytics.clicked ? analytics.clicked.toLocaleString() : 0} total CTA clicks
          </p>
        </div>

        <div className="glass rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">
            <span>Unsubscribe Rate</span>
            <UserMinus className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.unsubscribeRate}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {analytics.unsubscribed || 0} unsubscribed
          </p>
        </div>
      </div>

      {/* STEP 9 – EMAIL PERFORMANCE CHART BAR */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Performance Visualizer</h3>
          </div>
          <span className="text-xs text-gray-400">Mock Campaign Analytics</span>
        </div>

        <div className="space-y-4">
          {/* Sent Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span>Sent ({analytics.sent?.toLocaleString() || 0})</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Delivered Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span>Delivered ({analytics.delivered?.toLocaleString() || 0})</span>
              <span>{analytics.deliveredRate}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: analytics.deliveredRate || '98%' }}
              />
            </div>
          </div>

          {/* Opened Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span>Opened ({analytics.opened?.toLocaleString() || 0})</span>
              <span>{analytics.openRate}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: analytics.openRate || '68.4%' }}
              />
            </div>
          </div>

          {/* Clicked Bar */}
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span>Clicked ({analytics.clicked?.toLocaleString() || 0})</span>
              <span>{analytics.clickRate}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: analytics.clickRate || '24.6%' }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Campaign Information & Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Metadata */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Campaign Specifications
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Restaurant:</span>
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-brand-500" />
                  {campaign.restaurantName}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Branch:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {campaign.branchName}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Target Audience:</span>
                <span className="font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {campaign.audience}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Total Recipients:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {campaign.recipients ? campaign.recipients.toLocaleString() : '0'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Created Date:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {campaign.createdDate}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Scheduled Date:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {campaign.scheduledDate || campaign.createdDate}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-gray-400">Scheduled Time:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  {campaign.scheduledTime || 'N/A'} ({campaign.timezone || 'IST'})
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Email Subject & Preheader
            </h3>
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 space-y-2 text-xs">
              <div>
                <p className="text-gray-400 font-medium">Subject Line:</p>
                <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">{campaign.subject}</p>
              </div>
              {campaign.previewText && (
                <div>
                  <p className="text-gray-400 font-medium">Preheader Snippet:</p>
                  <p className="text-gray-700 dark:text-gray-300 italic mt-0.5">{campaign.previewText}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Rendered Email Preview */}
        <div className="lg:col-span-7">
          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Email Content Render Preview
            </h3>

            <div className="bg-gray-100 dark:bg-gray-950 p-4 sm:p-6 rounded-2xl">
              <div className="max-w-md mx-auto bg-white text-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-200 text-left font-sans">
                
                {/* Header */}
                <div className="p-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center font-bold text-white text-xs">
                      {campaign.restaurantName ? campaign.restaurantName.charAt(0) : 'R'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white leading-tight">
                        {campaign.restaurantName}
                      </h4>
                      <p className="text-[10px] text-gray-400">{campaign.branchName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-mono">
                    PROMO
                  </span>
                </div>

                {/* Banner Image */}
                {campaign.headerImage && (
                  <div className="w-full h-48 overflow-hidden bg-gray-100">
                    <img
                      src={campaign.headerImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Body */}
                <div className="p-5 space-y-4">
                  {campaign.emailTitle && (
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">
                      {campaign.emailTitle}
                    </h2>
                  )}

                  <div className="text-sm text-gray-700 leading-relaxed space-y-2 whitespace-pre-line">
                    {campaign.emailContent}
                  </div>

                  {campaign.ctaText && (
                    <div className="pt-3 text-center">
                      <a
                        href={campaign.ctaLink || '#'}
                        onClick={(e) => e.preventDefault()}
                        className="inline-block px-6 py-3 rounded-xl gradient-bg text-white font-bold text-sm shadow-md"
                      >
                        {campaign.ctaText}
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-[11px] text-gray-400 space-y-1">
                  <p>{campaign.footerText || 'Casa Bella Restaurant Group · Unsubscribe'}</p>
                  <p className="text-[10px]">© 2026 {campaign.restaurantName}. All rights reserved.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete &quot;{campaign.name}&quot;? All performance data for this campaign will be removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
