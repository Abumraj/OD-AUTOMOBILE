import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first, default to dark
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'dark';
    });

    useEffect(() => {
        // Apply theme to document
        const root = document.documentElement;
        
        if (theme === 'light') {
            root.classList.remove('dark');
            root.classList.add('light');
        } else {
            root.classList.remove('light');
            root.classList.add('dark');
        }
        
        // Save to localStorage
        localStorage.setItem('theme', theme);
        
        // Update favicon based on theme
        updateFavicon(theme);
    }, [theme]);

    const updateFavicon = (currentTheme) => {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
            // Use appropriate logo for favicon
            if (currentTheme === 'light') {
                favicon.href = '/logo-light.png';
            } else {
                favicon.href = '/logo-dark.png';
            }
        }
    };

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const value = {
        theme,
        toggleTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
