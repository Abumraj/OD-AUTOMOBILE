import React from 'react';
import GeneralSettingsManager from '../../../components/admin/GeneralSettingsManager';

function GeneralSettingsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">General Settings</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Configure general system settings and company information
                </p>
            </div>

            <GeneralSettingsManager />
        </div>
    );
}

export default GeneralSettingsPage;
