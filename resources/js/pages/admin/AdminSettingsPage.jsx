import React from 'react';
import WhatsAppSettingsManager from '../../components/admin/WhatsAppSettingsManager';
import ContactSettingsManager from '../../components/admin/ContactSettingsManager';
import TrackingProvidersManager from '../../components/admin/TrackingProvidersManager';
import PerformanceSettingsManager from '../../components/admin/PerformanceSettingsManager';
import SocialMediaSettingsManager from '../../components/admin/SocialMediaSettingsManager';

function AdminSettingsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Settings</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Configure system settings, integrations, and preferences
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
                <WhatsAppSettingsManager />
                <ContactSettingsManager />
            </div>

            <SocialMediaSettingsManager />

            <PerformanceSettingsManager />

            <TrackingProvidersManager />
        </div>
    );
}

export default AdminSettingsPage;
