export const dashboardStats = [
  {
    label: 'Total Restaurants',
    value: '12',
    growth: '+12%',
    icon: 'Building2',
    color: 'brand',
  },
  {
    label: 'Total Branches',
    value: '34',
    growth: '+25%',
    icon: 'MapPin',
    color: 'purple',
  },
  {
    label: 'Scheduled Posts',
    value: '48',
    growth: '+8%',
    icon: 'Calendar',
    color: 'indigo',
  },
  {
    label: 'Active Campaigns',
    value: '6',
    growth: '+15%',
    icon: 'Megaphone',
    color: 'accent',
  },
  {
    label: 'AI Generations',
    value: '284',
    growth: '+32%',
    icon: 'Sparkles',
    color: 'brand',
  },
  {
    label: 'Total Reach',
    value: '128K',
    growth: '+18%',
    icon: 'TrendingUp',
    color: 'purple',
  },
]

export const userProfile = {
  name: 'Yogesh',
  email: 'yogesh@social.ai',
  phone: '9597267653',
  businessName: 'Doe Restaurant Group',
  businessType: 'Multi-location Restaurant',
  avatar: 'Y',
  avatarUrl: null,
  joinedDate: 'March 2025',
  plan: 'Professional',
}

export const userSidebarLinks = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { label: 'Restaurants', icon: 'Building2', path: '/dashboard/restaurants' },
  { label: 'Posts', icon: 'FileText', path: '/dashboard/posts' },
  { label: 'Content Generator', icon: 'Sparkles', path: '/dashboard/content-generator' },
  { label: 'AI Assistant', icon: 'Bot', path: '/dashboard/ai-assistant' },
  { label: 'AI History', icon: 'History', path: '/dashboard/ai-history' },
  { label: 'Scheduler', icon: 'Calendar', path: '/dashboard/scheduler' },
  { label: 'Campaigns', icon: 'Megaphone', path: '/dashboard/campaigns' },
  { label: 'Analytics', icon: 'BarChart3', path: '/dashboard/analytics' },
  { label: 'Settings', icon: 'Settings', path: '/dashboard/settings' },
]

export const routeTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/restaurants': 'Restaurants',
  '/dashboard/restaurants/add': 'Add Restaurant',
  '/dashboard/posts': 'All Posts',
  '/dashboard/posts/create': 'Create Post',
  '/dashboard/posts/drafts': 'Draft Posts',
  '/dashboard/posts/scheduled': 'Scheduled Posts',
  '/dashboard/posts/published': 'Published Posts',
  '/dashboard/posts/preview': 'Post Preview',
  '/dashboard/content-generator': 'Content Generator',
  '/dashboard/ai-assistant': 'AI Assistant',
  '/dashboard/ai-history': 'AI History',
  '/dashboard/ai-history/:id': 'AI History Detail',
  '/dashboard/scheduler': 'Scheduler',
  '/dashboard/campaigns': 'Campaigns',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings': 'Settings',
  '/dashboard/profile': 'My Profile',
}

export const quickActions = [
  { label: 'Create New Post', icon: 'Plus', color: 'gradient-bg text-white', path: '/dashboard/posts/create' },
  { label: 'Generate AI Caption', icon: 'Sparkles', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', path: '/dashboard/content-generator' },
  { label: 'Open AI Assistant', icon: 'Bot', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400', path: '/dashboard/ai-assistant' },
  { label: 'View AI History', icon: 'History', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', path: '/dashboard/ai-history' },
]

export const upcomingPosts = [
  { post: 'Summer Menu Launch', platform: 'Instagram', location: 'Casa Bella', time: 'Today, 12:00 PM', status: 'Scheduled' },
  { post: 'Happy Hour Special', platform: 'Facebook', location: 'Downtown Bistro', time: 'Tomorrow, 5:00 PM', status: 'Scheduled' },
  { post: 'Weekend Brunch Promo', platform: 'TikTok', location: 'Garden Cafe', time: 'Sat, 10:00 AM', status: 'Draft' },
  { post: 'Chef\'s Table Event', platform: 'Instagram', location: 'Spice Route', time: 'Sun, 6:00 PM', status: 'Scheduled' },
]

export const businessTypes = [
  'Fine Dining',
  'Casual Dining',
  'Fast Casual',
  'Cafe & Bakery',
  'Bar & Lounge',
  'Multi-location Restaurant',
  'Food Truck',
  'Catering Service',
]

export const restaurantCategories = [
  'Italian',
  'Indian',
  'Mexican',
  'Asian Fusion',
  'American',
  'Mediterranean',
  'Cafe',
  'Seafood',
  'Vegetarian',
  'Other',
]
