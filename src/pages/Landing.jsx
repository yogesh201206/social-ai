import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Calendar, Building2, BarChart3, Megaphone, Image,
  Check, ChevronDown, Star, Play, ArrowRight, Mail, Phone, MapPin, Send,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'
import Card from '../components/Card'
import {
  features, howItWorks, pricingPlans, testimonials, faqs,
} from '../data/dummyData'

const iconMap = {
  Sparkles, Calendar, Building2, BarChart3, Megaphone, Image,
}

function DashboardMockup() {
  return (
    <div className="relative animate-float">
      <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 to-accent-500/20 rounded-3xl blur-2xl" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md max-w-xs mx-auto" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {['Restaurants', 'Posts', 'Campaigns'].map((label, i) => (
              <div key={label} className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/30">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{[4, 28, 6][i]}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {['Summer Menu Launch', 'Happy Hour Promo', 'Weekend Brunch'].map((post, i) => (
              <div key={post} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className={`h-8 w-8 rounded-lg ${['bg-brand-500', 'bg-purple-500', 'bg-accent-500'][i]} flex items-center justify-center`}>
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{post}</p>
                  <p className="text-[10px] text-gray-400">Scheduled • Instagram</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-400" />
              </div>
            ))}
          </div>
          <div className="mt-4 h-24 rounded-xl bg-gradient-to-r from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30 flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-brand-500 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white pr-4">{question}</span>
        <ChevronDown className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-4 animate-fade-in">
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      {/* Hero */}
      <section id="hero" className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                AI-Powered Social Media Marketing
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                Manage All Your{' '}
                <span className="gradient-text">Social Media Marketing</span>{' '}
                From One Dashboard
              </h1>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
                Generate AI captions, schedule posts, manage multiple restaurant locations, and grow your business effortlessly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="xl" className="w-full sm:w-auto">
                    Start Free Trial <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                  <Play className="h-5 w-5" /> Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-500" /> 14-day free trial
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-500" /> No credit card
                </span>
              </div>
            </div>
            <div className="animate-slide-up lg:delay-200">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-padding bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Everything You Need to <span className="gradient-text">Grow Online</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Powerful tools designed specifically for restaurants and local businesses.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature) => {
              const Icon = iconMap[feature.icon]
              return (
                <Card key={feature.title} hover className="p-6 lg:p-8">
                  <div className="p-3 rounded-xl gradient-bg w-fit mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Get started in minutes with our simple four-step process.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative text-center group">
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-brand-300 to-accent-300 dark:from-brand-700 dark:to-accent-700" />
                )}
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-bg text-white text-xl font-bold mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-padding bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                hover
                className={`p-8 relative ${plan.popular ? 'ring-2 ring-brand-500 shadow-xl shadow-brand-500/10' : ''}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-bg text-white text-xs font-semibold">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="h-4 w-4 text-brand-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    Get Started
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Loved by <span className="gradient-text">Restaurant Owners</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              See what our customers have to say about SocialFlow AI.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <Card key={t.name} hover className="p-8">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-padding bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Got questions? We&apos;ve got answers.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Get in <span className="gradient-text">Touch</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Have questions about SocialFlow AI? We&apos;d love to hear from you.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: Mail, text: 'hello@socialflow.ai' },
                  { icon: Phone, text: '+1 (555) 123-4567' },
                  { icon: MapPin, text: 'San Francisco, CA 94102' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30">
                      <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-8">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="you@restaurant.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    placeholder="How can we help?"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-shadow resize-none"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4" /> Send Message
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <div className="gradient-bg rounded-3xl p-10 sm:p-16 shadow-2xl shadow-brand-500/20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Social Media?
            </h2>
            <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of restaurants already growing their business with SocialFlow AI.
            </p>
            <Link to="/register">
              <Button variant="secondary" size="xl">
                Start Your Free Trial <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
