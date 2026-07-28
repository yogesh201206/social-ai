const postingTimes = [
  '7 PM – 9 PM',
  '11 AM – 1 PM',
  '5 PM – 7 PM',
  '12 PM – 2 PM',
  '6 PM – 8 PM',
]

const captionTemplates = {
  caption: (ctx) =>
    `Freshly prepared dishes made with premium ingredients at ${ctx.restaurantName}! 🍽️\n\nExperience authentic ${ctx.category} flavors crafted for ${ctx.audience.toLowerCase()} in ${ctx.location}. Every bite tells a story of passion and tradition.\n\nVisit us today and enjoy the ultimate taste experience.`,
  hashtags: (ctx) =>
    `Discover the best of ${ctx.category.toLowerCase()} in ${ctx.location}! Tag us in your food photos and join our growing community of food enthusiasts.`,
  promotional: (ctx) =>
    `🔥 Special offer at ${ctx.restaurantName}! Treat yourself to an unforgettable dining experience in the heart of ${ctx.location}.\n\nPerfect for ${ctx.audience.toLowerCase()} who appreciate quality, flavor, and warm hospitality. Don't miss out — this deal won't last long!`,
  festival: (ctx) =>
    `Celebrate the festive season with ${ctx.restaurantName}! ✨\n\nOur special festive menu brings together traditional ${ctx.category} favorites with a modern twist. Gather your loved ones and make memories over a feast made for ${ctx.audience.toLowerCase()}.\n\nLimited seats available — reserve your table in ${ctx.location} today!`,
  offer: (ctx) =>
    `🎉 EXCLUSIVE OFFER at ${ctx.restaurantName}!\n\nFor a limited time, enjoy special combo deals on our most-loved ${ctx.category} dishes. Perfect for ${ctx.audience.toLowerCase()} looking for great value without compromising on taste.\n\nWalk in or order now — ${ctx.location}'s favorite spot awaits!`,
  product: (ctx) =>
    `Introducing our signature dish — a masterpiece of ${ctx.category} cuisine! 🌟\n\nHandcrafted with locally sourced ingredients and time-honored recipes, this dish is designed to delight ${ctx.audience.toLowerCase()} with every bite.\n\nAvailable now at ${ctx.restaurantName}, ${ctx.location}.`,
}

const hashtagSets = {
  caption: ['#FoodLovers', '#RestaurantLife', '#FreshFood', '#LocalEats', '#FoodieLife', '#TasteTheDifference'],
  hashtags: ['#FoodLovers', '#InstaFood', '#FoodPhotography', '#RestaurantMarketing', '#EatLocal', '#FoodBlogger'],
  promotional: ['#SpecialOffer', '#FoodDeals', '#DineOut', '#RestaurantPromo', '#LimitedTime', '#FoodLovers'],
  festival: ['#FestivalVibes', '#FestiveFood', '#Celebration', '#HolidayDining', '#FoodFestival', '#SeasonalMenu'],
  offer: ['#ComboOffer', '#FoodDeals', '#SaveBig', '#RestaurantOffer', '#LimitedOffer', '#GrabItNow'],
  product: ['#SignatureDish', '#ChefSpecial', '#MustTry', '#FoodPorn', '#NewOnMenu', '#FoodDiscovery'],
}

const ctaTemplates = {
  caption: (ctx) => `Visit ${ctx.restaurantName} today and grab your special combo offer!`,
  hashtags: (ctx) => `Follow @${ctx.restaurantName.replace(/\s/g, '').toLowerCase()} for daily food inspiration!`,
  promotional: (ctx) => `Book your table now — offer valid this week only at ${ctx.location}!`,
  festival: (ctx) => `Reserve your festive table at ${ctx.restaurantName} before seats fill up!`,
  offer: (ctx) => `Visit us today and grab your special combo offer!`,
  product: (ctx) => `Order now and taste why ${ctx.audience.toLowerCase()} love ${ctx.restaurantName}!`,
}

const postIdeas = (ctx) => [
  `"A Day in the Life" reel showcasing your ${ctx.category} kitchen prep at ${ctx.restaurantName}`,
  `Customer testimonial carousel featuring your best reviews from ${ctx.location}`,
  `Before/after plating video of your signature dish for ${ctx.audience.toLowerCase()}`,
  `Team spotlight introducing your head chef and their favorite recipe`,
  `Poll: "Which new ${ctx.category} dish should we add to the menu?" engagement post`,
]

const marketingContent = (ctx) =>
  `${ctx.restaurantName} — Where ${ctx.category} Meets Excellence in ${ctx.location}.\n\nTarget Audience: ${ctx.audience}\n\nKey Message: We deliver authentic flavors, warm hospitality, and memorable dining experiences that keep ${ctx.audience.toLowerCase()} coming back.\n\nCampaign Hook: "Taste the tradition. Feel the passion."\n\nRecommended Channels: Instagram, Facebook, Google Business Profile\n\nSuggested Frequency: 4–5 posts per week with 1 reel and 1 story daily.`

function pickPostingTime(seed) {
  return postingTimes[seed % postingTimes.length]
}

export function generateAIContent(input, generationType = 'full') {
  const ctx = {
    restaurantName: input.restaurantName || 'Spice Garden',
    category: input.category || 'South Indian Restaurant',
    audience: input.audience || 'Food Lovers',
    location: input.location || 'Madurai',
    contentType: input.contentType || 'caption',
  }

  const type = ctx.contentType
  const seed = ctx.restaurantName.length + ctx.location.length

  const base = {
    caption: captionTemplates[type]?.(ctx) || captionTemplates.caption(ctx),
    hashtags: hashtagSets[type] || hashtagSets.caption,
    cta: ctaTemplates[type]?.(ctx) || ctaTemplates.caption(ctx),
    bestPostingTime: pickPostingTime(seed),
    postIdeas: postIdeas(ctx),
    marketingContent: marketingContent(ctx),
    contentType: contentTypesLabel(type),
    restaurantName: ctx.restaurantName,
    generatedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  }

  if (generationType === 'caption') {
    return { ...base, hashtags: [], cta: base.cta }
  }
  if (generationType === 'hashtags') {
    return { caption: '', hashtags: base.hashtags, cta: '', bestPostingTime: base.bestPostingTime, contentType: base.contentType, restaurantName: base.restaurantName, generatedAt: base.generatedAt }
  }
  if (generationType === 'postIdea') {
    return { caption: base.postIdeas.join('\n\n'), hashtags: [], cta: '', bestPostingTime: base.bestPostingTime, contentType: 'Post Ideas', restaurantName: base.restaurantName, generatedAt: base.generatedAt, postIdeas: base.postIdeas }
  }
  if (generationType === 'marketing') {
    return { caption: base.marketingContent, hashtags: base.hashtags, cta: base.cta, bestPostingTime: base.bestPostingTime, contentType: 'Marketing Content', restaurantName: base.restaurantName, generatedAt: base.generatedAt }
  }

  return base
}

function contentTypesLabel(type) {
  const map = {
    caption: 'Social Media Caption',
    hashtags: 'Hashtags',
    promotional: 'Promotional Text',
    festival: 'Festival Post',
    offer: 'Offer Announcement',
    product: 'Product Description',
  }
  return map[type] || 'Social Media Caption'
}

export const chatResponses = [
  {
    keywords: ['diwali', 'festival', 'festive'],
    response: (name) =>
      `Celebrate Diwali with our special festive menu at ${name || 'your cafe'}! ✨\n\nEnjoy traditional sweets, curated thali combos, and family feast packages. Light up your celebrations with flavors that bring everyone together.\n\n🪔 Book your table now — limited festive slots available!`,
  },
  {
    keywords: ['weekend', 'special', 'offer'],
    response: (name) =>
      `Weekend vibes at ${name || 'your restaurant'}! 🎉\n\nThis Saturday & Sunday: Buy 1 Get 1 on select mains + complimentary dessert with every family platter. Perfect for food lovers who want great value and unforgettable taste.\n\nTag your weekend crew and join us!`,
  },
  {
    keywords: ['instagram', 'reel', 'video'],
    response: (name) =>
      `Here's a reel idea for ${name || 'your restaurant'}:\n\n📹 "60-Second Kitchen Magic"\n\n• 0-5s: Hook — sizzling pan close-up\n• 5-20s: Quick prep montage\n• 20-45s: Plating the hero dish\n• 45-60s: First bite reaction + CTA\n\nCaption: "POV: Your cravings just got answered 🔥"\nHashtags: #FoodReels #KitchenMagic #FoodTok`,
  },
  {
    keywords: ['hashtag', 'hashtags', 'tags'],
    response: () =>
      `Recommended hashtag mix for restaurants:\n\n🎯 Brand (3): #YourRestaurantName #ChefSpecial #EatAt[Location]\n\n📍 Local (4): #MaduraiFood #FoodIn[City] #LocalEats #CityFoodGuide\n\n🔥 Trending (5): #FoodLovers #InstaFood #FoodPhotography #FoodieLife #RestaurantLife\n\nTip: Use 8–12 hashtags on Instagram, 3–5 on Facebook.`,
  },
  {
    keywords: ['review', 'testimonial', 'customer'],
    response: (name) =>
      `"We came for dinner and left as family" — that's what our guests say about ${name || 'us'}! ⭐⭐⭐⭐⭐\n\nShare your favorite customer review as a carousel post:\n\nSlide 1: Review quote\nSlide 2: Photo of the dish they loved\nSlide 3: Team thank-you message\n\nSocial proof drives 3x more engagement!`,
  },
  {
    keywords: ['menu', 'launch', 'new dish'],
    response: (name) =>
      `🚀 NEW MENU ALERT at ${name || 'your restaurant'}!\n\nWe're thrilled to unveil our latest creations — crafted with seasonal ingredients and bold new flavors. From appetizers to desserts, every dish is a journey worth sharing.\n\nBe among the first to try them. Reserve your tasting experience today!`,
  },
]

export function getChatResponse(message, restaurantName = '') {
  const lower = message.toLowerCase()
  const match = chatResponses.find((r) => r.keywords.some((k) => lower.includes(k)))
  if (match) return match.response(restaurantName)

  return `Great question! Here's a tailored suggestion for ${restaurantName || 'your business'}:\n\n"${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"\n\nBased on current food marketing trends, I recommend:\n\n1. Lead with a strong visual hook in the first line\n2. Include a clear call-to-action (Reserve, Order, Visit)\n3. Post between 7 PM – 9 PM for maximum engagement\n4. Use 5–8 relevant hashtags mixing brand and local tags\n\nWould you like me to expand this into a full caption or hashtag set?`
}

export default generateAIContent
