import React from 'react';
import TrackingProvidersManager from '../../../components/admin/TrackingProvidersManager';

function TrackingSettingsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Tracking Settings</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Configure tracking providers and settings
                </p>
            </div>

            <TrackingProvidersManager />
        </div>
    );
}

export default TrackingSettingsPage;
