export const contentTypes = [
  { id: 'caption', label: 'Social Media Caption', icon: 'MessageSquare' },
  { id: 'hashtags', label: 'Hashtags', icon: 'Hash' },
  { id: 'promotional', label: 'Promotional Text', icon: 'Megaphone' },
  { id: 'festival', label: 'Festival Post', icon: 'PartyPopper' },
  { id: 'offer', label: 'Offer Announcement', icon: 'Tag' },
  { id: 'product', label: 'Product Description', icon: 'UtensilsCrossed' },
]

export const trendingSuggestions = [
  {
    id: 's1',
    title: 'Weekend Special Offer',
    description: 'Promote limited-time weekend deals to drive foot traffic and boost weekend sales.',
    icon: 'CalendarDays',
    prompt: 'Create a weekend special offer post for my restaurant',
    contentType: 'offer',
  },
  {
    id: 's2',
    title: 'Customer Review Post',
    description: 'Showcase glowing customer reviews and build social proof for your brand.',
    icon: 'Star',
    prompt: 'Write a social media post featuring a customer review',
    contentType: 'promotional',
  },
  {
    id: 's3',
    title: 'Behind The Scenes',
    description: 'Give followers a peek into your kitchen, prep process, or team culture.',
    icon: 'Camera',
    prompt: 'Create a behind-the-scenes kitchen post for social media',
    contentType: 'caption',
  },
  {
    id: 's4',
    title: 'New Menu Launch',
    description: 'Announce new dishes with mouth-watering descriptions and launch excitement.',
    icon: 'Sparkles',
    prompt: 'Write a new menu launch announcement post',
    contentType: 'promotional',
  },
  {
    id: 's5',
    title: 'Happy Hour Promo',
    description: 'Drive evening traffic with cocktail and appetizer specials.',
    icon: 'Wine',
    prompt: 'Create a happy hour promotional post',
    contentType: 'offer',
  },
  {
    id: 's6',
    title: 'Chef\'s Special Story',
    description: 'Highlight your chef\'s signature dish with a personal storytelling angle.',
    icon: 'ChefHat',
    prompt: 'Write a chef special story post for Instagram',
    contentType: 'caption',
  },
]

export default trendingSuggestions
