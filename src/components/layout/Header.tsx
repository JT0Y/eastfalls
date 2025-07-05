import React, { useState, useEffect } from 'react';
import { Home, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  zipCode: string;
  onZipCodeChange: (zip: string) => void;
}

// AnimatedLogo component: house + sun/moon, animates on dark mode toggle
const AnimatedLogo: React.FC<{ isDarkMode: boolean; onClick: () => void }> = ({ isDarkMode, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center group focus:outline-none"
      aria-label="Toggle dark mode"
      tabIndex={0}
    >
      {/* House icon */}
      <span className="relative block">
        <Home className={`h-8 w-8 transition-colors duration-500 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
        {/* Sun/Moon icon, animated position and color, with more spacing */}
        <span
          className={`absolute transition-all duration-700 ease-in-out pointer-events-none select-none ${
            isDarkMode
              ? 'left-[-10px] top-[-8px] translate-x-0' // more left and up
              : 'left-[22px] top-[-8px] translate-x-0' // more right and up
          }`}
          style={{ zIndex: 2 }}
        >
          {isDarkMode ? (
            <Moon className="h-4 w-4 text-blue-400 drop-shadow" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-400 drop-shadow" />
          )}
        </span>
      </span>
      <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white select-none transition-colors duration-500">
        EastFalls.Homes
      </span>
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ toggleDarkMode, isDarkMode, zipCode, onZipCodeChange }) => {
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm' 
          : 'bg-white dark:bg-gray-900'
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Animated Logo acts as dark mode toggle */}
        <AnimatedLogo isDarkMode={isDarkMode} onClick={toggleDarkMode} />
        <div className="flex items-center space-x-6">
          <div className="text-lg font-mono text-gray-700 dark:text-gray-100">
            {formatTime(time)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;