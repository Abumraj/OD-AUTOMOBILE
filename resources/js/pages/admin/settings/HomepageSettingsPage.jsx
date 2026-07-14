import React from 'react';
import HomepageServicesManager from '../../../components/admin/HomepageServicesManager';

function HomepageSettingsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Homepage Settings</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Manage homepage services and featured content
                </p>
            </div>

            <HomepageServicesManager />
        </div>
    );
}

export default HomepageSettingsPage;
