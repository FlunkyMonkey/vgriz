import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from 'axios';

// Set default axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';

// Create theme with FamilyCabin.io branding
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
