import React from 'react';
import WhatsAppSettingsManager from '../../../components/admin/WhatsAppSettingsManager';
import ContactSettingsManager from '../../../components/admin/ContactSettingsManager';

function ContactSettingsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Contact Settings</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Configure contact information and WhatsApp integration
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
                <WhatsAppSettingsManager />
                <ContactSettingsManager />
            </div>
        </div>
    );
}

export default ContactSettingsPage;
