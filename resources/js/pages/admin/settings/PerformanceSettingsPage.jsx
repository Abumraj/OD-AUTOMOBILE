import React from 'react';
import PerformanceSettingsManager from '../../../components/admin/PerformanceSettingsManager';

function PerformanceSettingsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Performance Settings</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Configure performance metrics and statistics
                </p>
            </div>

            <PerformanceSettingsManager />
        </div>
    );
}

export default PerformanceSettingsPage;
