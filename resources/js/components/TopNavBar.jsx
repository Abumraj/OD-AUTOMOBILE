import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

function TopNavBar() {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggleTheme, isDark } = useTheme();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/services', label: 'Services' },
        { path: '/tracking', label: 'Tracking' },
        { path: '/auctions', label: 'Auctions' },
        { path: '/about', label: 'About' },
        { path: '/contact', label: 'Contact' }
    ];

    return (
        <nav className="bg-surface-container-low dark:bg-surface-container-low docked full-width top-0 border-b border-white/10 shadow-sm sticky z-50">
            <div className="flex justify-between items-center w-full px-4 md:px-lg py-base max-w-container-max mx-auto">
                <Link to="/" className="flex items-center gap-base" onClick={() => setMenuOpen(false)}>
                    <img
                        alt="OD Automotive"
                        className="h-8 md:h-10 w-auto"
                        src={isDark ? '/logo-dark.png' : '/logo-light.png'}
                    />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-lg">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`font-title-md text-title-md transition-colors ${
                                isActive(link.path)
                                    ? 'text-secondary border-b-2 border-secondary pb-1'
                                    : 'text-on-surface-variant hover:text-secondary'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-on-surface-variant hover:text-on-surface transition-colors rounded-lg hover:bg-surface-container"
                        aria-label="Toggle theme"
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    <Link
                        to="/quote"
                        className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-3 md:px-4 py-2 rounded-lg hover:opacity-80 transition-opacity active:scale-95 duration-150 text-sm md:text-base"
                    >
                        Get a Quote
                    </Link>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-2 text-on-surface"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {menuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile Nav Drawer */}
            {menuOpen && (
                <div className="md:hidden bg-surface-container border-t border-white/10">
                    <div className="px-4 py-2 space-y-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMenuOpen(false)}
                                className={`block py-3 px-2 rounded-lg font-title-md text-title-md transition-colors ${
                                    isActive(link.path)
                                        ? 'text-secondary bg-surface-container-highest'
                                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}

export default TopNavBar;
