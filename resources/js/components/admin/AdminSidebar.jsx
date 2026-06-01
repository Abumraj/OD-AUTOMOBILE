import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function AdminSidebar() {
    const location = useLocation();

    const navItems = [
        { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
        { path: '/admin/shipments', icon: 'local_shipping', label: 'Shipments' },
        { path: '/admin/quotes', icon: 'request_quote', label: 'Quotes' },
        { path: '/admin/auctions', icon: 'gavel', label: 'Auctions' },
        { path: '/admin/testimonials', icon: 'star', label: 'Testimonials' },
        { path: '/admin/messages', icon: 'mail', label: 'Messages' },
        { path: '/admin/services', icon: 'build', label: 'Services' },
        { path: '/admin/carousel', icon: 'view_carousel', label: 'Carousel' },
        { path: '/admin/legal-pages', icon: 'policy', label: 'Legal Pages' },
        { path: '/admin/settings', icon: 'settings', label: 'Settings' },
    ];

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin' || location.pathname === '/admin/';
        }
        return location.pathname === path;
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container border-r border-outline-variant flex flex-col py-md z-50">
            <div className="px-md mb-lg">
                <h1 className="font-display-lg text-display-lg font-bold text-secondary">OD Logistics</h1>
                <p className="font-label-md text-label-md text-on-surface-variant opacity-70">Operations Center</p>
            </div>

            <nav className="flex-grow flex flex-col space-y-1 overflow-y-auto overflow-x-hidden pr-1">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-3 px-4 py-3 transition-transform active:scale-95 ${
                            isActive(item.path)
                                ? 'text-secondary font-bold border-r-4 border-secondary bg-surface-container-highest'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors duration-200'
                        }`}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span className="font-label-md text-label-md">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="px-md mt-auto space-y-4">
                <button className="w-full bg-secondary-container text-on-secondary-container py-3 rounded font-bold font-label-md flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity">
                    <span className="material-symbols-outlined">add</span>
                    <span>New Shipment</span>
                </button>
                <div className="border-t border-outline-variant pt-md">
                    <Link
                        to="/admin/support"
                        className="flex items-center space-x-3 text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-surface-container-highest transition-colors mb-1"
                    >
                        <span className="material-symbols-outlined">help</span>
                        <span className="font-label-md text-label-md">Support</span>
                    </Link>
                    <button className="flex items-center space-x-3 text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-surface-container-highest transition-colors w-full text-left">
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-label-md text-label-md">Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default AdminSidebar;
