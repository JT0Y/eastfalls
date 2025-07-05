import React, { useEffect, useState } from 'react';
import Header from './components/layout/Header';
import Dashboard from './components/layout/Dashboard';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [zipCode, setZipCode] = useState('19129');

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

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
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <Header 
        toggleDarkMode={toggleDarkMode} 
        isDarkMode={isDarkMode} 
        zipCode={zipCode}
        onZipCodeChange={handleZipCodeChange}
      />
      <Dashboard zipCode={zipCode} />
    </div>
  );
}

export default App;