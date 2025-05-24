import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Toaster } from 'react-hot-toast';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import App from './App';
import theme from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#4caf50',
                  },
                },
                error: {
                  style: {
                    background: '#f44336',
                  },
                },
              }}
            />
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Initialize stagewise toolbar in development mode only
if (process.env.NODE_ENV === 'development') {
  import('@stagewise/toolbar-react').then(({ StagewiseToolbar }) => {
    const stagewiseConfig = {
      plugins: []
    };

    // Create a separate DOM element for the toolbar
    const toolbarElement = document.createElement('div');
    toolbarElement.id = 'stagewise-toolbar';
    document.body.appendChild(toolbarElement);

    // Create a separate React root for the toolbar
    const toolbarRoot = ReactDOM.createRoot(toolbarElement);
    toolbarRoot.render(<StagewiseToolbar config={stagewiseConfig} />);
  }).catch((error) => {
    console.warn('Failed to load stagewise toolbar:', error);
  });
} 