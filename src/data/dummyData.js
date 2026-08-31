export const features = [
  {
    icon: 'Sparkles',
    title: 'AI Caption Generator',
    description:
      'Create engaging, on-brand captions for X, LinkedIn, and YouTube in seconds with our AI-powered writing assistant.',
  },
  {
    icon: 'Calendar',
    title: 'Smart Scheduling',
    description:
      'Plan and schedule posts across all platforms. Set it once and let SocialFlow AI handle the rest.',
  },
  {
    icon: 'Building2',
    title: 'Multi-Location Management',
    description:
      'Manage social media for multiple restaurant locations from a single, unified dashboard.',
  },
  {
    icon: 'BarChart3',
    title: 'Analytics & Insights',
    description:
      'Track engagement, reach, and growth with beautiful dashboards and actionable insights.',
  },
  {
    icon: 'Megaphone',
    title: 'Campaign Management',
    description:
      'Launch targeted marketing campaigns for seasonal menus, events, and special promotions.',
  },
  {
    icon: 'Image',
    title: 'Media Library',
    description:
      'Organize food photos, videos, and brand assets in one place for quick access when creating posts.',
  },
]

export const howItWorks = [
  {
    step: '01',
    title: 'Connect Your Locations',
    description: 'Add your restaurants, cafes, or bars and link your social media accounts in minutes.',
  },
  {
    step: '02',
    title: 'Generate AI Content',
    description: 'Use AI to create captions, hashtags, and post ideas tailored to your brand voice.',
  },
  {
    step: '03',
    title: 'Schedule & Publish',
    description: 'Plan your content calendar and auto-publish across all connected platforms.',
  },
  {
    step: '04',
    title: 'Track & Grow',
    description: 'Monitor performance, optimize campaigns, and watch your audience grow.',
  },
]

export const pricingPlans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for single-location businesses getting started.',
    features: [
      '1 Location',
      '50 AI Generations/mo',
      'Basic Scheduling',
      'Instagram & Facebook',
      'Email Support',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    price: 79,
    description: 'Ideal for growing businesses with multiple locations.',
    features: [
      'Up to 5 Locations',
      'Unlimited AI Generations',
      'Advanced Scheduling',
      'All Social Platforms',
      'Analytics Dashboard',
      'Priority Support',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For restaurant groups and franchises at scale.',
    features: [
      'Unlimited Locations',
      'Unlimited AI Generations',
      'Custom Branding',
      'API Access',
      'Dedicated Account Manager',
      '24/7 Phone Support',
    ],
    popular: false,
  },
]

export const testimonials = [
  {
    name: 'Maria Rodriguez',
    role: 'Owner, Casa Bella Restaurant',
    avatar: 'MR',
    content:
      'SocialFlow AI transformed how we manage social media. Our engagement increased 3x in just two months!',
    rating: 5,
  },
  {
    name: 'James Chen',
    role: 'Marketing Director, Brew & Bite Co.',
    avatar: 'JC',
    content:
      'Managing 8 cafe locations was a nightmare. Now I schedule a week of content in under an hour. Game changer.',
    rating: 5,
  },
  {
    name: 'Sarah Thompson',
    role: 'Owner, The Garden Bistro',
    avatar: 'ST',
    content:
      'The AI captions are incredibly on-brand. My customers always comment on how professional our posts look.',
    rating: 5,
  },
]

export const faqs = [
  {
    question: 'What social media platforms do you support?',
    answer:
      'SocialFlow AI supports X (Twitter), LinkedIn, and YouTube, with Instagram and Facebook integrations coming soon. We are constantly adding new platform integrations.',
  },
  {
    question: 'Can I manage multiple restaurant locations?',
    answer:
      'Yes! Our Professional and Enterprise plans allow you to manage multiple locations from a single dashboard, each with its own branding and content strategy.',
  },
  {
    question: 'How does the AI caption generator work?',
    answer:
      'Our AI analyzes your brand voice, menu items, and past content to generate engaging captions, hashtags, and post ideas tailored specifically to your business.',
  },
  {
    question: 'Is there a free trial available?',
    answer:
      'Yes! We offer a 14-day free trial on all plans with full access to features. No credit card required to get started.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Absolutely. There are no long-term contracts. You can upgrade, downgrade, or cancel your subscription at any time from your account settings.',
  },
]

export const userDashboardStats = [
  { label: 'Total Restaurants', value: '4', change: '+1 this month', icon: 'Building2', color: 'brand' },
  { label: 'Scheduled Posts', value: '28', change: '12 this week', icon: 'Calendar', color: 'purple' },
  { label: 'Active Campaigns', value: '6', change: '2 ending soon', icon: 'Megaphone', color: 'indigo' },
  { label: 'AI Generations', value: '142', change: '+38 this week', icon: 'Sparkles', color: 'accent' },
]

export const recentActivities = [
  {
    id: 1,
    action: 'Post scheduled',
    detail: 'Summer Menu Launch – Instagram',
    time: '2 minutes ago',
    icon: 'Calendar',
  },
  {
    id: 2,
    action: 'AI caption generated',
    detail: 'Weekend Brunch Special – Facebook',
    time: '15 minutes ago',
    icon: 'Sparkles',
  },
  {
    id: 3,
    action: 'Campaign started',
    detail: 'Happy Hour Promotion – All locations',
    time: '1 hour ago',
    icon: 'Megaphone',
  },
  {
    id: 4,
    action: 'New restaurant added',
    detail: 'Downtown Bistro location connected',
    time: '3 hours ago',
    icon: 'Building2',
  },
  {
    id: 5,
    action: 'Post published',
    detail: 'Chef\'s Special Friday – LinkedIn',
    time: '5 hours ago',
    icon: 'Send',
  },
]

export const notifications = [
  {
    id: 1,
    title: 'Post published successfully',
    message: 'Your Instagram post for Casa Bella is now live.',
    time: '5 min ago',
    read: false,
  },
  {
    id: 2,
    title: 'Campaign ending soon',
    message: 'Summer Menu Launch ends in 2 days.',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    title: 'Weekly report ready',
    message: 'Your analytics report for last week is available.',
    time: '3 hours ago',
    read: true,
  },
  {
    id: 4,
    title: 'New AI feature',
    message: 'Try our new hashtag optimizer for better reach.',
    time: '1 day ago',
    read: true,
  },
]

export const adminDashboardStats = [
  { label: 'Total Users', value: '2,847', change: '+124 this month', icon: 'Users', color: 'brand' },
  { label: 'Active Users', value: '1,923', change: '67% active rate', icon: 'UserCheck', color: 'purple' },
  { label: 'Total Restaurants', value: '5,621', change: '+312 this month', icon: 'Building2', color: 'indigo' },
  { label: 'Total Posts', value: '48,392', change: '+2,841 this week', icon: 'FileText', color: 'accent' },
]

export const recentUsers = [
  {
    id: 1,
    name: 'Emily Watson',
    email: 'emily@casabella.com',
    plan: 'Professional',
    restaurants: 3,
    joined: 'Jun 20, 2026',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Michael Park',
    email: 'michael@brewbite.co',
    plan: 'Enterprise',
    restaurants: 8,
    joined: 'Jun 19, 2026',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Lisa Nguyen',
    email: 'lisa@gardenbistro.com',
    plan: 'Starter',
    restaurants: 1,
    joined: 'Jun 18, 2026',
    status: 'Active',
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'david@tacotown.com',
    plan: 'Professional',
    restaurants: 4,
    joined: 'Jun 17, 2026',
    status: 'Trial',
  },
  {
    id: 5,
    name: 'Anna Schmidt',
    email: 'anna@cafeberlin.de',
    plan: 'Starter',
    restaurants: 1,
    joined: 'Jun 16, 2026',
    status: 'Inactive',
  },
]

export const systemActivities = [
  {
    id: 1,
    event: 'New user registration',
    user: 'emily@casabella.com',
    time: '2 min ago',
    type: 'user',
  },
  {
    id: 2,
    event: 'Plan upgraded to Enterprise',
    user: 'michael@brewbite.co',
    time: '18 min ago',
    type: 'billing',
  },
  {
    id: 3,
    event: 'API rate limit warning',
    user: 'system',
    time: '45 min ago',
    type: 'system',
  },
  {
    id: 4,
    event: 'New restaurant onboarded',
    user: 'lisa@gardenbistro.com',
    time: '1 hour ago',
    type: 'restaurant',
  },
  {
    id: 5,
    event: 'Support ticket resolved',
    user: 'david@tacotown.com',
    time: '2 hours ago',
    type: 'support',
  },
]


export const adminSidebarLinks = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: '/admin' },
  { label: 'Users', icon: 'Users', path: '/admin/users' },
  { label: 'Restaurants', icon: 'Building2', path: '/admin/restaurants' },
  { label: 'Reports', icon: 'FileBarChart', path: '/admin/reports' },
  { label: 'Settings', icon: 'Settings', path: '/admin/settings' },
]
