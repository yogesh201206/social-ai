import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { AuthProvider } from './context/AuthContext'
import { RestaurantProvider } from './context/RestaurantContext'
import { PostProvider } from './context/PostContext'
import { AIProvider } from './context/AIContext'
import { SchedulerProvider } from './context/SchedulerContext'
import { AnalyticsProvider } from './context/AnalyticsContext'
import { EmailMarketingProvider } from './context/EmailMarketingContext'
import { AdminProvider } from './context/AdminContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <RestaurantProvider>
              <PostProvider>
                <AIProvider>
                  <SchedulerProvider>
                    <AnalyticsProvider>
                      <EmailMarketingProvider>
                        <AdminProvider>
                          <App />
                        </AdminProvider>
                      </EmailMarketingProvider>
                    </AnalyticsProvider>
                  </SchedulerProvider>
                </AIProvider>
              </PostProvider>
            </RestaurantProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
