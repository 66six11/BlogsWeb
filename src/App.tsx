import React from 'react';
import { ThemeProvider } from './core/ThemeProvider';
import AppContent from './core/App';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
