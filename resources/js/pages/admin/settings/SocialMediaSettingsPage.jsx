import React from 'react';
import SocialMediaSettingsManager from '../../../components/admin/SocialMediaSettingsManager';

function SocialMediaSettingsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Social Media Settings</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Configure social media links and integrations
                </p>
            </div>

            <SocialMediaSettingsManager />
        </div>
    );
}

export default SocialMediaSettingsPage;
