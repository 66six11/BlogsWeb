import './styles/index.css';
import React, { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import { isPreviewMode } from './data/mockData';

// Lazy load UI preview page in dev or preview mode
const UIPreviewPage = (import.meta.env.DEV || isPreviewMode())
  ? lazy(() => import('./pages/UIPreviewPage'))
  : null;

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <StrictMode>
      <BrowserRouter>
        <Routes>
          {/* Dev and preview mode UI preview route */}
          {(import.meta.env.DEV || isPreviewMode()) && UIPreviewPage && (
            <Route 
              path="/ui-preview" 
              element={
                <Suspense fallback={
                  <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-purple-400">
                    Loading UI Preview...
                  </div>
                }>
                  <UIPreviewPage />
                </Suspense>
              } 
            />
          )}
          
          {/* Main application route - catches all other paths */}
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  </ErrorBoundary>
);
