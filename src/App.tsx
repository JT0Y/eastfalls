import React, { useEffect, useState } from 'react';
import Header from './components/layout/Header';
import Dashboard from './components/layout/Dashboard';
import { DataProvider } from './DataContext';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [zipCode, setZipCode] = useState('19129');

  // Only check system preference on mount
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Toggle dark class on isDarkMode change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleZipCodeChange = (newZipCode: string) => {
    setZipCode(newZipCode);
  };

  return (
    <DataProvider>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-950 text-gray-100' // much darker background and light text for accessibility
          : 'bg-gray-100 text-gray-900'
      }`}>
        <Header 
          toggleDarkMode={toggleDarkMode} 
          isDarkMode={isDarkMode} 
          zipCode={zipCode}
          onZipCodeChange={handleZipCodeChange}
        />
        <Dashboard zipCode={zipCode} />
      </div>
    </DataProvider>
  );
}

export default App;