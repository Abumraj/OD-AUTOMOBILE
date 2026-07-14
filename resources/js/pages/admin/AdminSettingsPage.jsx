import React from 'react';
import { Link } from 'react-router-dom';

function AdminSettingsPage() {
    const settingsCategories = [
        {
            title: 'General Settings',
            description: 'Configure general system settings and company information',
            icon: 'tune',
            path: '/admin/settings/general',
            color: 'bg-blue-500/20 text-blue-400'
        },
        {
            title: 'Email Templates',
            description: 'Manage email templates for customer notifications',
            icon: 'email',
            path: '/admin/settings/email-templates',
            color: 'bg-green-500/20 text-green-400'
        },
        {
            title: 'SMS Settings',
            description: 'Configure SMS service and manage SMS templates',
            icon: 'sms',
            path: '/admin/settings/sms',
            color: 'bg-purple-500/20 text-purple-400'
        },
        {
            title: 'Homepage Settings',
            description: 'Manage homepage services and featured content',
            icon: 'home',
            path: '/admin/settings/homepage',
            color: 'bg-orange-500/20 text-orange-400'
        },
        {
            title: 'Contact Settings',
            description: 'Configure contact information and WhatsApp integration',
            icon: 'contact_page',
            path: '/admin/settings/contact',
            color: 'bg-cyan-500/20 text-cyan-400'
        },
        {
            title: 'Social Media',
            description: 'Configure social media links and integrations',
            icon: 'share',
            path: '/admin/settings/social-media',
            color: 'bg-pink-500/20 text-pink-400'
        },
        {
            title: 'Performance Settings',
            description: 'Configure performance metrics and statistics',
            icon: 'speed',
            path: '/admin/settings/performance',
            color: 'bg-yellow-500/20 text-yellow-400'
        },
        {
            title: 'Tracking Settings',
            description: 'Configure tracking providers and settings',
            icon: 'location_on',
            path: '/admin/settings/tracking',
            color: 'bg-red-500/20 text-red-400'
        },
        {
            title: 'Shipping Configuration',
            description: 'Manage shipping types, lines, and import/export data',
            icon: 'inventory_2',
            path: '/admin/settings/shipping',
            color: 'bg-indigo-500/20 text-indigo-400'
        }
    ];

    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Settings</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Configure system settings, integrations, and preferences
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {settingsCategories.map((category) => (
                    <Link
                        key={category.path}
                        to={category.path}
                        className="bg-surface-container rounded-xl p-lg border border-white/10 hover:border-secondary-container/50 transition-all group"
                    >
                        <div className="flex items-start space-x-md mb-md">
                            <div className={`p-md rounded-lg ${category.color}`}>
                                <span className="material-symbols-outlined text-2xl">
                                    {category.icon}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-title-lg text-white mb-xs group-hover:text-secondary transition-colors">
                                    {category.title}
                                </h3>
                                <p className="font-body-sm text-on-surface-variant">
                                    {category.description}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center text-secondary font-label-md">
                            <span>Configure</span>
                            <span className="material-symbols-outlined ml-xs">arrow_forward</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default AdminSettingsPage;
