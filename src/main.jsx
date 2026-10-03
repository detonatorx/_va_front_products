import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './style.css';
import './photos.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);
