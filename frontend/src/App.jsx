import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import ProtectedRoute from './components/ProtectedRoute'

const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'))
const LandingPage = React.lazy(() => import('./pages/LandingPage'))
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const PerformanceReviewsPage = React.lazy(() => import('./pages/PerformanceReviewsPage'))
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import './App.css'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <BrowserRouter>
          <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#666' }}>Loading ACME Talent Hub...</div>}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performance-reviews"
                element={
                  <ProtectedRoute>
                    <PerformanceReviewsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App