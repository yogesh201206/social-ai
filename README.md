# SocialFlow AI

A modern SaaS frontend for restaurant social media marketing, built with React, Vite, Tailwind CSS, React Router, and Lucide React icons.

## Features

- **Landing Page** — Hero, features, how it works, pricing, testimonials, FAQ, contact, and footer
- **Authentication** — Login, register, and forgot password pages with glassmorphism design
- **User Dashboard** — Stats cards, recent activity, quick actions, and upcoming posts
- **Admin Dashboard** — Platform overview, recent users table, and system activity
- **Dark Mode** — Toggle across all pages
- **Fully Responsive** — Desktop, tablet, and mobile layouts

## Tech Stack

- React 18 + Vite
- Tailwind CSS 3
- React Router DOM 6
- Lucide React Icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Routes

| Route | Page |
|-------|------|
| `/` | Landing Page |
| `/login` | Login (redirects to `/dashboard`) |
| `/register` | Register |
| `/forgot-password` | Forgot Password |
| `/dashboard` | User Dashboard |
| `/admin` | Admin Dashboard |

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Page components
├── layouts/          # Layout wrappers
├── routes/           # Route definitions
├── data/             # Dummy data
├── context/          # Theme context (dark mode)
├── App.jsx
└── main.jsx
```
