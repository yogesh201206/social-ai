import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, MapPin, Sparkles, Calendar, Clock, Globe,
  Users, CheckCircle, Eye, Monitor, Smartphone, Bold, Italic, Underline,
  List, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Link as LinkIcon,
  Sparkle, X, Send, Save, RefreshCw, Wand2
} from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import { useEmailMarketing } from '../../context/EmailMarketingContext'
import { useRestaurants } from '../../context/RestaurantContext'
import { useAI } from '../../context/AIContext'
import { audienceOptions, audienceRecipientCounts, mockAISuggestions } from '../../data/emailMarketingData'

export default function CreateEmailCampaign() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addCampaign, updateCampaign, getCampaign } = useEmailMarketing()
  const { restaurants } = useRestaurants()
  const { addToHistory } = useAI()

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    restaurantId: '',
    restaurantName: '',
    branchId: '',
    branchName: '',
    audience: 'Returning Customers',
    recipients: 2480,
    subject: '',
    previewText: '',
    emailTitle: '',
    emailContent: '',
    headerImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Reserve a Table',
    ctaLink: 'https://socialflow.ai/order',
    footerText: 'Thank you for choosing our restaurant group. Unsubscribe',
    scheduleOption: 'schedule', // 'send_now' or 'schedule'
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '11:00 AM',
    timezone: 'Asia/Kolkata',
  })

  // Load existing campaign if editing
  const isEditing = Boolean(id)
  useEffect(() => {
    if (isEditing) {
      const existing = getCampaign(id)
      if (existing) {
        setFormData({
          name: existing.name || '',
          restaurantId: existing.restaurantId || '',
          restaurantName: existing.restaurantName || '',
          branchId: existing.branchId || '',
          branchName: existing.branchName || '',
          audience: existing.audience || 'Returning Customers',
          recipients: existing.recipients || 2480,
          subject: existing.subject || '',
          previewText: existing.previewText || '',
          emailTitle: existing.emailTitle || existing.name || '',
          emailContent: existing.emailContent || '',
          headerImage: existing.headerImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
          ctaText: existing.ctaText || 'Order Now',
          ctaLink: existing.ctaLink || '',
          footerText: existing.footerText || '',
          scheduleOption: existing.status === 'Sent' ? 'send_now' : 'schedule',
          scheduledDate: existing.scheduledDate || new Date().toISOString().split('T')[0],
          scheduledTime: existing.scheduledTime || '11:00 AM',
          timezone: existing.timezone || 'Asia/Kolkata',
        })
      }
    } else if (restaurants.length > 0 && !formData.restaurantId) {
      // Preselect first restaurant & branch
      const firstR = restaurants[0]
      const firstB = firstR.branches?.[0]
      setFormData((prev) => ({
        ...prev,
        restaurantId: firstR.id,
        restaurantName: firstR.name,
        branchId: firstB?.id || '',
        branchName: firstB?.name || '',
      }))
    }
  }, [id, isEditing, getCampaign, restaurants])

  // Get available branches when restaurant changes
  const selectedRestaurantObj = useMemo(() => {
    return restaurants.find((r) => r.id === formData.restaurantId)
  }, [restaurants, formData.restaurantId])

  const availableBranches = selectedRestaurantObj?.branches || []

  // Update recipients count when audience changes
  const handleAudienceChange = (aud) => {
    const estimatedCount = audienceRecipientCounts[aud] || 1500
    setFormData((prev) => ({
      ...prev,
      audience: aud,
      recipients: estimatedCount,
    }))
  }

  const handleRestaurantChange = (rId) => {
    const rObj = restaurants.find((r) => r.id === rId)
    const firstB = rObj?.branches?.[0]
    setFormData((prev) => ({
      ...prev,
      restaurantId: rId,
      restaurantName: rObj ? rObj.name : '',
      branchId: firstB ? firstB.id : '',
      branchName: firstB ? firstB.name : '',
    }))
  }

  const handleBranchChange = (bId) => {
    const bObj = availableBranches.find((b) => b.id === bId)
    setFormData((prev) => ({
      ...prev,
      branchId: bId,
      branchName: bObj ? bObj.name : '',
    }))
  }

  // Formatting state for email content editor
  const [textAlign, setTextAlign] = useState('left')
  const [activeFormats, setActiveFormats] = useState([])

  const toggleFormat = (fmt) => {
    setActiveFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    )
  }

  // Preview device view state (Desktop vs Mobile)
  const [previewDevice, setPreviewDevice] = useState('desktop') // 'desktop' | 'mobile'

  // AI Modal state
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPromptType, setAiPromptType] = useState('subject') // 'subject' | 'email' | 'cta' | 'promo'
  const [generatedAiOptions, setGeneratedAiOptions] = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  const handleOpenAI = () => {
    generateAISuggestions('subject')
    setShowAIModal(true)
  }

  const generateAISuggestions = (type) => {
    setAiPromptType(type)
    setAiLoading(true)
    setTimeout(() => {
      let suggestions = []
      if (type === 'subject') suggestions = mockAISuggestions.subjectLines
      else if (type === 'email') suggestions = mockAISuggestions.emailBodies
      else if (type === 'cta') suggestions = mockAISuggestions.ctaTexts
      else if (type === 'promo') suggestions = mockAISuggestions.promotionalMessages

      setGeneratedAiOptions(suggestions)
      setAiLoading(false);
    }, 400)
  }

  const applyAISuggestion = (suggestionText) => {
    if (aiPromptType === 'subject') {
      setFormData((prev) => ({ ...prev, subject: suggestionText }))
    } else if (aiPromptType === 'email') {
      setFormData((prev) => ({ ...prev, emailContent: suggestionText }))
    } else if (aiPromptType === 'cta') {
      setFormData((prev) => ({ ...prev, ctaText: suggestionText }))
    } else if (aiPromptType === 'promo') {
      setFormData((prev) => ({
        ...prev,
        emailContent: prev.emailContent ? `${prev.emailContent}\n\n${suggestionText}` : suggestionText,
      }))
    }

    addToHistory({
      contentType: 'Email Marketing Content',
      restaurant: formData.restaurantName || 'Casa Bella',
      prompt: `Generate ${aiPromptType} for email campaign`,
      output: suggestionText,
    })

    setShowAIModal(false)
  }

  // Success Modal State
  const [successModalData, setSuccessModalData] = useState(null)

  // Handle Form Submission
  const handleSubmit = (statusToSave) => {
    if (!formData.name.trim()) {
      alert('Please enter a campaign name.')
      return
    }

    const payload = {
      ...formData,
      status: statusToSave === 'Draft' ? 'Draft' : formData.scheduleOption === 'send_now' ? 'Sent' : 'Scheduled',
      emailTitle: formData.emailTitle || formData.name,
      sentDate: formData.scheduleOption === 'send_now' ? new Date().toISOString().split('T')[0] : null,
    }

    let savedCampaign
    if (isEditing) {
      savedCampaign = updateCampaign(id, payload)
    } else {
      savedCampaign = addCampaign(payload)
    }

    setSuccessModalData(savedCampaign)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/email-marketing"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Email Campaign' : 'Create Email Campaign'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Build, customize, preview and launch email marketing campaigns for your restaurant guests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => handleSubmit('Draft')}>
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button variant="primary" onClick={() => handleSubmit('Schedule')}>
            <Send className="h-4 w-4" />
            {formData.scheduleOption === 'send_now' ? 'Send Now' : 'Schedule Campaign'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Sections (Left) & Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Multi-section Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION 1 – CAMPAIGN DETAILS */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Section 1 – Campaign Details</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Set the campaign name and target venue</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Weekend Special Feast Offer"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Restaurant
                  </label>
                  <select
                    value={formData.restaurantId}
                    onChange={(e) => handleRestaurantChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                  >
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Branch
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 2 – AUDIENCE */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Section 2 – Audience</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose who will receive this email</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                Estimated Audience: {formData.recipients.toLocaleString()} customers
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {audienceOptions.map((option) => {
                const isSelected = formData.audience === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAudienceChange(option)}
                    className={`p-3.5 rounded-xl border text-left transition-all text-xs font-semibold ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <p className="font-bold text-sm">{option}</p>
                    <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 mt-1">
                      ~{(audienceRecipientCounts[option] || 1500).toLocaleString()} subscribers
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* SECTION 3 – EMAIL CONTENT */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Section 3 – Email Content</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Write subject, preview snippet, and body text</p>
                </div>
              </div>

              {/* AI Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAI}
                className="gradient-border text-xs flex items-center gap-1.5"
              >
                <Wand2 className="h-3.5 w-3.5 text-brand-500" />
                Generate with AI
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. 🍷 Exclusive 20% Off Weekend Fine Dining at Casa Bella!"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Preview Text (Preheader)
                </label>
                <input
                  type="text"
                  value={formData.previewText}
                  onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                  placeholder="e.g. Treat yourself to authentic handmade pasta and fine wine this weekend."
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                />
              </div>

              {/* Email Body Editor Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Message Body
                </label>

                {/* Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 rounded-t-xl bg-gray-100 dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => toggleFormat('bold')}
                    className={`p-1.5 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                      activeFormats.includes('bold') ? 'bg-gray-300 dark:bg-gray-600 font-bold' : ''
                    }`}
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFormat('italic')}
                    className={`p-1.5 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                      activeFormats.includes('italic') ? 'bg-gray-300 dark:bg-gray-600 italic' : ''
                    }`}
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFormat('underline')}
                    className={`p-1.5 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                      activeFormats.includes('underline') ? 'bg-gray-300 dark:bg-gray-600 underline' : ''
                    }`}
                    title="Underline"
                  >
                    <Underline className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
                  <button
                    type="button"
                    onClick={() => setTextAlign('left')}
                    className={`p-1.5 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                      textAlign === 'left' ? 'bg-gray-300 dark:bg-gray-600' : ''
                    }`}
                    title="Align Left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextAlign('center')}
                    className={`p-1.5 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                      textAlign === 'center' ? 'bg-gray-300 dark:bg-gray-600' : ''
                    }`}
                    title="Align Center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextAlign('right')}
                    className={`p-1.5 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                      textAlign === 'right' ? 'bg-gray-300 dark:bg-gray-600' : ''
                    }`}
                    title="Align Right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        emailContent: prev.emailContent ? `${prev.emailContent}\n• ` : '• ',
                      }))
                    }}
                    className="p-1.5 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={formData.emailContent}
                  onChange={(e) => setFormData({ ...formData, emailContent: e.target.value })}
                  placeholder="Write your email body content here..."
                  className={`w-full p-4 rounded-b-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all ${
                    activeFormats.includes('bold') ? 'font-bold' : ''
                  } ${activeFormats.includes('italic') ? 'italic' : ''} ${
                    activeFormats.includes('underline') ? 'underline' : ''
                  } text-${textAlign}`}
                />
              </div>
            </div>
          </Card>

          {/* SECTION 4 – EMAIL DESIGN & CTA */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Section 4 – Email Design & CTA</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add banner image, title header, CTA button and footer text</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Header Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.headerImage}
                    onChange={(e) => setFormData({ ...formData, headerImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const presets = [
                        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80'
                      ]
                      const next = presets[(presets.indexOf(formData.headerImage) + 1) % presets.length]
                      setFormData({ ...formData, headerImage: next })
                    }}
                    className="px-3 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    Random Preset
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Headline / Banner Title
                </label>
                <input
                  type="text"
                  value={formData.emailTitle}
                  onChange={(e) => setFormData({ ...formData, emailTitle: e.target.value })}
                  placeholder="e.g. Weekend Culinary Delights Await You"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="e.g. Order Now, Reserve a Table, View Menu"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Order Now', 'Reserve a Table', 'View Menu', 'Claim Offer'].map((btnLabel) => (
                      <button
                        key={btnLabel}
                        type="button"
                        onClick={() => setFormData({ ...formData, ctaText: btnLabel })}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/30 transition-colors"
                      >
                        {btnLabel}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CTA Button Link
                  </label>
                  <input
                    type="text"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    placeholder="https://yourrestaurant.com/order"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="e.g. Casa Bella Restaurant Group · Chennai · Unsubscribe"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/50 outline-none transition-all"
                />
              </div>
            </div>
          </Card>

          {/* SECTION 7 – SCHEDULE EMAIL OPTIONS */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Section 5 – Schedule & Launch Options</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose when this campaign goes out</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scheduleOption: 'send_now' })}
                  className={`p-3.5 rounded-xl border text-center font-semibold text-sm transition-all ${
                    formData.scheduleOption === 'send_now'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Send Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scheduleOption: 'schedule' })}
                  className={`p-3.5 rounded-xl border text-center font-semibold text-sm transition-all ${
                    formData.scheduleOption === 'schedule'
                      ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Schedule for Later
                </button>
              </div>

              {formData.scheduleOption === 'schedule' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Time
                    </label>
                    <input
                      type="text"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      placeholder="11:00 AM"
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link to="/dashboard/email-marketing">
                  <Button variant="ghost">Cancel</Button>
                </Link>
                <Button variant="secondary" onClick={() => handleSubmit('Draft')}>
                  Save Draft
                </Button>
                <Button variant="primary" onClick={() => handleSubmit('Schedule')}>
                  {formData.scheduleOption === 'send_now' ? 'Send Campaign Now' : 'Schedule Campaign'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - STEP 6: Professional Email Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <Card className="p-4 sm:p-6 shadow-xl border border-gray-200/80 dark:border-gray-700/80">
              {/* Preview Header & Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-brand-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Live Email Preview</h3>
                </div>

                {/* Device Mode Toggle Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      previewDevice === 'desktop'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      previewDevice === 'mobile'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile
                  </button>
                </div>
              </div>

              {/* Email Envelope Header */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-xl text-xs space-y-1.5 mb-4 border border-gray-200/60 dark:border-gray-700/60">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">From:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {formData.restaurantName || 'Casa Bella'} &lt;promo@{formData.restaurantName?.toLowerCase().replace(/\s+/g, '') || 'casabella'}.com&gt;
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">To:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {formData.audience} ({formData.recipients.toLocaleString()} guests)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Subject:</span>
                  <span className="font-bold text-gray-900 dark:text-white truncate max-w-[240px]">
                    {formData.subject || 'Your Email Subject Here'}
                  </span>
                </div>
              </div>

              {/* Centered Email Card Box */}
              <div
                className={`mx-auto transition-all duration-300 ${
                  previewDevice === 'mobile' ? 'max-w-[320px]' : 'w-full'
                }`}
              >
                <div className="bg-white text-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 text-left font-sans">
                  
                  {/* Restaurant Header & Logo */}
                  <div className="p-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center font-bold text-white text-xs shadow-md">
                        {formData.restaurantName ? formData.restaurantName.charAt(0) : 'R'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white leading-tight">
                          {formData.restaurantName || 'Casa Bella'}
                        </h4>
                        <p className="text-[10px] text-gray-400">{formData.branchName || 'Downtown Branch'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-mono">
                      SPECIAL OFFER
                    </span>
                  </div>

                  {/* Header Image */}
                  {formData.headerImage && (
                    <div className="w-full h-44 overflow-hidden bg-gray-100 relative">
                      <img
                        src={formData.headerImage}
                        alt="Email Header"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content Container */}
                  <div className="p-5 space-y-4">
                    {formData.emailTitle && (
                      <h2 className="text-xl font-bold text-gray-900 leading-tight">
                        {formData.emailTitle}
                      </h2>
                    )}

                    <p className="text-xs text-gray-500 italic border-l-2 border-brand-500 pl-2">
                      {formData.previewText || 'Preview snippet shown in customer email client inbox...'}
                    </p>

                    <div className="text-sm text-gray-700 leading-relaxed space-y-2 whitespace-pre-line">
                      {formData.emailContent ||
                        'Dear valued guest,\n\nWe are delighted to invite you to sample our chef specials this week. Enjoy handcrafted flavors, refreshing drinks, and warm service.'}
                    </div>

                    {/* CTA Button */}
                    {formData.ctaText && (
                      <div className="pt-3 text-center">
                        <a
                          href={formData.ctaLink || '#'}
                          onClick={(e) => e.preventDefault()}
                          className="inline-block px-6 py-3 rounded-xl gradient-bg text-white font-bold text-sm shadow-md shadow-brand-500/30 hover:opacity-95"
                        >
                          {formData.ctaText}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-[11px] text-gray-400 space-y-1">
                    <p>{formData.footerText || 'You received this email because you dined at our restaurant.'}</p>
                    <p className="text-[10px]">© 2026 {formData.restaurantName || 'SocialFlow AI'}. All rights reserved.</p>
                  </div>
                </div>
              </div>

            </Card>
          </div>
        </div>
      </div>

      {/* STEP 5 – AI EMAIL GENERATION MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl gradient-bg text-white">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Content Assistant</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Generate high-converting email copy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Prompt Type Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'subject', label: 'Subject' },
                { id: 'email', label: 'Email Body' },
                { id: 'cta', label: 'CTA Text' },
                { id: 'promo', label: 'Promo Msg' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => generateAISuggestions(tab.id)}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    aiPromptType === tab.id
                      ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* AI Results Options */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {aiLoading ? (
                <div className="py-8 text-center space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-brand-500 mx-auto" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Crafting personalized email content with AI...</p>
                </div>
              ) : (
                generatedAiOptions.map((optionText, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-brand-50/40 dark:hover:bg-brand-900/20 hover:border-brand-500 transition-all group flex items-start justify-between gap-3"
                  >
                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-line">
                      {optionText}
                    </p>
                    <button
                      type="button"
                      onClick={() => applyAISuggestion(optionText)}
                      className="px-2.5 py-1 rounded-lg bg-brand-500 text-white text-xs font-semibold shrink-0 hover:bg-brand-600 transition-colors shadow-sm"
                    >
                      Use This
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" size="sm" onClick={() => setShowAIModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7 – SUCCESS CONFIRMATION MODAL */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
              <CheckCircle className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {successModalData.status === 'Scheduled'
                ? 'Email Campaign Scheduled Successfully'
                : successModalData.status === 'Sent'
                ? 'Email Campaign Sent Successfully'
                : 'Campaign Saved as Draft'}
            </h3>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
              {successModalData.status === 'Scheduled'
                ? 'Your campaign has been queued and will automatically dispatch at the scheduled time.'
                : 'Your changes have been saved to your campaign dashboard.'}
            </p>

            {/* Campaign Summary Details */}
            <div className="mt-6 space-y-2.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-xs text-left border border-gray-200/60 dark:border-gray-700/60">
              <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                <span className="text-gray-500 dark:text-gray-400">Campaign Name:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{successModalData.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                <span className="text-gray-500 dark:text-gray-400">Restaurant:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{successModalData.restaurantName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
                <span className="text-gray-500 dark:text-gray-400">Audience & Recipients:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {successModalData.audience} ({successModalData.recipients?.toLocaleString()} guests)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400">Scheduled Date & Time:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {successModalData.scheduledDate || successModalData.createdDate} at {successModalData.scheduledTime || 'Immediate'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => navigate('/dashboard/email-marketing')}
              >
                Go to Campaigns
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => navigate(`/dashboard/email-marketing/${successModalData.id}`)}
              >
                View Campaign Details
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
