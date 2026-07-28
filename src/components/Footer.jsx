import { Link } from 'react-router-dom'
import { Sparkles, Mail, Phone, MapPin, Twitter, Instagram, Linkedin, Facebook } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Contact', href: '#contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl gradient-bg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                SocialFlow <span className="text-brand-400">AI</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              AI-powered social media marketing platform built for restaurants, cafes, bars, and local businesses.
            </p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Linkedin, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 rounded-lg bg-gray-800 hover:bg-brand-600 text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-brand-400 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SocialFlow AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> hello@socialflow.ai
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> +1 (555) 123-4567
            </span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <MapPin className="h-3.5 w-3.5" /> San Francisco, CA
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
