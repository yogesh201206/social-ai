import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationProvider } from './context/NotificationContext'
import { RestaurantProvider } from './context/RestaurantContext'
import { PostProvider } from './context/PostContext'
import { AIProvider } from './context/AIContext'
import { SchedulerProvider } from './context/SchedulerContext'
import { AnalyticsProvider } from './context/AnalyticsContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <RestaurantProvider>
            <PostProvider>
              <AIProvider>
                <SchedulerProvider>
                  <AnalyticsProvider>
                    <App />
                  </AnalyticsProvider>
                </SchedulerProvider>
              </AIProvider>
            </PostProvider>
          </RestaurantProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
