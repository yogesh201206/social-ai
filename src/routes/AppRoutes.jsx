import { Routes, Route } from 'react-router-dom'
import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ForgotPassword from '../pages/ForgotPassword'
import UserDashboard from '../pages/UserDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'
import RestaurantList from '../pages/restaurants/RestaurantList'
import AddRestaurant from '../pages/restaurants/AddRestaurant'
import RestaurantDetails from '../pages/restaurants/RestaurantDetails'
import AllPosts from '../pages/posts/AllPosts'
import CreatePost from '../pages/posts/CreatePost'
import DraftPosts from '../pages/posts/DraftPosts'
import ScheduledPosts from '../pages/posts/ScheduledPosts'
import PublishedPosts from '../pages/posts/PublishedPosts'
import PostDetails from '../pages/posts/PostDetails'
import PostPreviewPage from '../pages/posts/PostPreviewPage'
import DashboardLayout from '../layouts/DashboardLayout'
import { userSidebarLinks } from '../data/dashboardData'
import { adminSidebarLinks } from '../data/dummyData'
import AIContentGenerator from '../pages/ai/AIContentGenerator'
import AIAssistant from '../pages/ai/AIAssistant'
import AIHistory from '../pages/ai/AIHistory'
import AIHistoryDetail from '../pages/ai/AIHistoryDetail'
import Scheduler from '../pages/scheduler/Scheduler'
import CreateSchedule from '../pages/scheduler/CreateSchedule'
import ScheduledPostDetails from '../pages/scheduler/ScheduledPostDetails'
import Analytics from '../pages/analytics/Analytics'
import PlatformAnalytics from '../pages/analytics/PlatformAnalytics'
import PostAnalytics from '../pages/analytics/PostAnalytics'

import EmailMarketing from '../pages/email/EmailMarketing'
import CreateEmailCampaign from '../pages/email/CreateEmailCampaign'
import EmailCampaignDetails from '../pages/email/EmailCampaignDetails'

function PlaceholderPage({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="h-16 w-16 rounded-2xl gradient-bg flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
        {description || 'This page is coming soon in a future phase.'}
      </p>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<DashboardLayout links={userSidebarLinks} />}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/restaurants" element={<RestaurantList />} />
        <Route path="/dashboard/restaurants/add" element={<AddRestaurant />} />
        <Route path="/dashboard/restaurants/:id" element={<RestaurantDetails />} />
        <Route path="/dashboard/restaurants/:id/edit" element={<PlaceholderPage title="Edit Restaurant" description="Restaurant editing will be available in the next update." />} />
        <Route path="/dashboard/posts" element={<AllPosts />} />
        <Route path="/dashboard/posts/create" element={<CreatePost />} />
        <Route path="/dashboard/posts/drafts" element={<DraftPosts />} />
        <Route path="/dashboard/posts/scheduled" element={<ScheduledPosts />} />
        <Route path="/dashboard/posts/published" element={<PublishedPosts />} />
        <Route path="/dashboard/posts/preview" element={<PostPreviewPage />} />
        <Route path="/dashboard/posts/:id/edit" element={<CreatePost />} />
        <Route path="/dashboard/posts/:id" element={<PostDetails />} />
        <Route path="/dashboard/content-generator" element={<AIContentGenerator />} />
        <Route path="/dashboard/ai-assistant" element={<AIAssistant />} />
        <Route path="/dashboard/ai-history" element={<AIHistory />} />
        <Route path="/dashboard/ai-history/:id" element={<AIHistoryDetail />} />
        <Route path="/dashboard/ai-history-detail" element={<AIHistoryDetail />} />
        <Route path="/dashboard/scheduler" element={<Scheduler />} />
        <Route path="/dashboard/scheduler/create" element={<CreateSchedule />} />
        <Route path="/dashboard/scheduler/:id" element={<ScheduledPostDetails />} />
        <Route path="/dashboard/email-marketing" element={<EmailMarketing />} />
        <Route path="/dashboard/email-marketing/create" element={<CreateEmailCampaign />} />
        <Route path="/dashboard/email-marketing/:id" element={<EmailCampaignDetails />} />
        <Route path="/dashboard/email-marketing/:id/edit" element={<CreateEmailCampaign />} />
        <Route path="/dashboard/campaigns" element={<EmailMarketing />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
        <Route path="/dashboard/analytics/platforms" element={<PlatformAnalytics />} />
        <Route path="/dashboard/analytics/posts" element={<PostAnalytics />} />
        <Route path="/dashboard/settings" element={<Settings />} />
      </Route>

      <Route element={<DashboardLayout links={adminSidebarLinks} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<PlaceholderPage title="Users Management" />} />
        <Route path="/admin/restaurants" element={<PlaceholderPage title="Restaurants Management" />} />
        <Route path="/admin/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/admin/settings" element={<PlaceholderPage title="Admin Settings" />} />
      </Route>
    </Routes>
  )
}
