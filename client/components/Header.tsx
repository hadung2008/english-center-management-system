import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, BellIcon, ChevronDownIcon, SunIcon, MoonIcon, LogoutIcon } from './icons';
import type { Theme } from '../App';
import { useTranslation } from '../lib/i18n';
import { User } from '../types';

interface HeaderProps {
    theme: Theme;
    toggleTheme: () => void;
    currentUser: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, currentUser, onLogout }) => {
  const { language, setLanguage, t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = () => {
    const newLang = language === 'en' ? 'vi' : 'en';
    setLanguage(newLang);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);


  return (
    <header className="h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 md:px-8 lg:px-10 flex-shrink-0">
      {/* Search bar */}
      <div className="flex items-center w-full max-w-lg">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </span>
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-full bg-secondary dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Right side icons and profile */}
      <div className="flex items-center space-x-4">
        <button 
            onClick={handleLanguageChange} 
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
        >
            {language.toUpperCase()}
        </button>

        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
        </button>

        <div className="relative">
          <BellIcon className="w-6 h-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </div>

        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full"
                />
                <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role}</p>
                </div>
                <ChevronDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>

            {isDropdownOpen && (
                 <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                         <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onLogout();
                                setIsDropdownOpen(false);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            <LogoutIcon className="w-5 h-5 mr-3" />
                            {t('header.logout')}
                        </a>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;