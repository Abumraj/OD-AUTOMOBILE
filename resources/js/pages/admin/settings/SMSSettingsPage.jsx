import React from 'react';
import TermiiSettingsManager from '../../../components/admin/TermiiSettingsManager';
import SMSTemplatesManager from '../../../components/admin/SMSTemplatesManager';

function SMSSettingsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">SMS Settings</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Configure SMS service and manage SMS templates
                </p>
            </div>

            <TermiiSettingsManager />

            <SMSTemplatesManager />
        </div>
    );
}

export default SMSSettingsPage;
