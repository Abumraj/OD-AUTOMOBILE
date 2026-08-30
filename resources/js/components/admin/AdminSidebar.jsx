import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function AdminSidebar({ mobileOpen, onClose, admin }) {
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/admin/settings'));

    const baseNavItems = [
        { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
        { path: '/admin/analytics', icon: 'analytics', label: 'Analytics' },
        { path: '/admin/client-orders', icon: 'person_search', label: 'Client Orders' },
        { path: '/admin/shipments', icon: 'local_shipping', label: 'Shipments' },
        { path: '/admin/procurement', icon: 'inventory_2', label: 'Procurement' },
        { path: '/admin/autosales', icon: 'sell', label: 'Autosales' },
        { path: '/admin/clearance', icon: 'fact_check', label: 'Clearance' },
        { path: '/admin/trucking', icon: 'local_shipping', label: 'Trucking' },
        { path: '/admin/quotes', icon: 'request_quote', label: 'Quotes' },
        { path: '/admin/auctions', icon: 'gavel', label: 'Auctions' },
        { path: '/admin/testimonials', icon: 'star', label: 'Testimonials' },
        { path: '/admin/messages', icon: 'mail', label: 'Messages' },
        { path: '/admin/services', icon: 'build', label: 'Services' },
        { path: '/admin/carousel', icon: 'view_carousel', label: 'Carousel' },
        { path: '/admin/legal-pages', icon: 'policy', label: 'Legal Pages' },
        { path: '/admin/about-us', icon: 'info', label: 'About Us' },
    ];

    const superadminNavItems = [
        { path: '/admin/revenue-analysis', icon: 'paid', label: 'Revenue Analysis' },
        { path: '/admin/admin-users', icon: 'admin_panel_settings', label: 'Admin Users' },
    ];

    const navItems = admin?.role === 'superadmin' 
        ? [...baseNavItems, ...superadminNavItems] 
        : baseNavItems;

    const settingsItems = [
        { path: '/admin/settings/general', icon: 'tune', label: 'General' },
        { path: '/admin/settings/email-templates', icon: 'email', label: 'Email Templates' },
        { path: '/admin/settings/sms', icon: 'sms', label: 'SMS' },
        { path: '/admin/settings/homepage', icon: 'home', label: 'Homepage' },
        { path: '/admin/settings/contact', icon: 'contact_page', label: 'Contact' },
        { path: '/admin/settings/social-media', icon: 'share', label: 'Social Media' },
        { path: '/admin/settings/performance', icon: 'speed', label: 'Performance' },
        { path: '/admin/settings/tracking', icon: 'location_on', label: 'Tracking' },
        { path: '/admin/settings/shipping', icon: 'inventory_2', label: 'Shipping Config' },
    ];

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin' || location.pathname === '/admin/';
        }
        return location.pathname === path;
    };

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside className={`fixed left-0 top-0 h-screen w-64 bg-surface-container border-r border-outline-variant flex flex-col py-md z-50 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-md mb-lg flex items-center justify-between">
                    <div>
                        <h1 className="font-display-lg text-display-lg font-bold text-secondary">OD Logistics</h1>
                        <p className="font-label-md text-label-md text-on-surface-variant opacity-70">Operations Center</p>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-1 text-on-surface-variant hover:text-on-surface">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-grow flex flex-col space-y-1 overflow-y-auto overflow-x-hidden pr-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
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

                    {/* Settings Menu with Submenu */}
                    <div>
                        <button
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className={`flex items-center justify-between w-full px-4 py-3 transition-colors ${
                                location.pathname.startsWith('/admin/settings')
                                    ? 'text-secondary font-bold bg-surface-container-highest'
                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="material-symbols-outlined">settings</span>
                                <span className="font-label-md text-label-md">Settings</span>
                            </div>
                            <span className={`material-symbols-outlined transition-transform ${
                                settingsOpen ? 'rotate-180' : ''
                            }`}>expand_more</span>
                        </button>
                        
                        {settingsOpen && (
                            <div className="ml-4 border-l-2 border-outline-variant">
                                {settingsItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`flex items-center space-x-3 px-4 py-2 transition-transform active:scale-95 ${
                                            isActive(item.path)
                                                ? 'text-secondary font-bold border-r-4 border-secondary bg-surface-container-highest'
                                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors duration-200'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{item.icon}</span>
                                        <span className="font-label-sm text-label-sm">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
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
                        <button
                            onClick={() => window.location.href = '/admin/login'}
                            className="flex items-center space-x-3 text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-surface-container-highest transition-colors w-full text-left"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            <span className="font-label-md text-label-md">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default AdminSidebar;
