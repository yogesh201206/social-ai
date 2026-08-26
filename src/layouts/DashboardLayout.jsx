import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MobileSidebar from '../components/MobileSidebar'
import DashboardTopbar from '../components/DashboardTopbar'
import { routeTitles } from '../data/dashboardData'

function getPageTitle(pathname) {
  if (routeTitles[pathname]) return routeTitles[pathname]

  if (pathname.match(/\/admin\/users\/[^/]+$/)) return 'User Details'
  if (pathname.match(/\/admin\/restaurants\/[^/]+$/)) return 'Restaurant Details'
  if (pathname.match(/\/dashboard\/restaurants\/[^/]+$/)) return 'Restaurant Details'
  if (pathname.match(/\/dashboard\/restaurants\/[^/]+\/edit$/)) return 'Edit Restaurant'
  if (pathname.match(/\/dashboard\/posts\/[^/]+\/edit$/)) return 'Edit Post'
  if (pathname.match(/\/dashboard\/posts\/[^/]+$/) && !pathname.endsWith('/create') && !pathname.endsWith('/drafts') && !pathname.endsWith('/scheduled') && !pathname.endsWith('/published') && !pathname.endsWith('/preview')) return 'Post Details'
  if (pathname.match(/^\/dashboard\/ai-history\/[^/]+$/)) return 'AI History Detail'
  if (pathname === '/dashboard/scheduler/create') return 'Schedule Post'
  if (pathname.match(/^\/dashboard\/scheduler\/[^/]+$/)) return 'Scheduled Post'

  return 'Dashboard'
}

export default function DashboardLayout({ links }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        links={links}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />
      <MobileSidebar
        links={links}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardTopbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
