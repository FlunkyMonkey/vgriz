import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context imports
import { AuthProvider } from './context/AuthContext';

// Page imports
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Calendar from './pages/Calendar';
import NoticeBoard from './pages/NoticeBoard';
import DocumentRepository from './pages/DocumentRepository';
import MessageBoard from './pages/MessageBoard';
import GuestBook from './pages/GuestBook';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Component imports
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Lake blue color
      light: '#4791db',
      dark: '#115293',
    },
    secondary: {
      main: '#388e3c', // Forest green color
      light: '#5eae60',
      dark: '#276229',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/guest/:pinCode" element={<GuestBook mode="guest" />} />
            
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } />
              
              <Route path="/notices" element={
                <ProtectedRoute>
                  <NoticeBoard />
                </ProtectedRoute>
              } />
              
              <Route path="/documents" element={
                <ProtectedRoute>
                  <DocumentRepository />
                </ProtectedRoute>
              } />
              
              <Route path="/messages" element={
                <ProtectedRoute>
                  <MessageBoard />
                </ProtectedRoute>
              } />
              
              <Route path="/guestbook" element={
                <ProtectedRoute>
                  <GuestBook mode="owner" />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
