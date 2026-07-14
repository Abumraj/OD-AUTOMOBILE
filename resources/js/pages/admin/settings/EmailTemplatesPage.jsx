import React from 'react';
import EmailTemplatesManager from '../../../components/admin/EmailTemplatesManager';

function EmailTemplatesPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Email Templates</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Manage email templates for customer notifications
                </p>
            </div>

            <EmailTemplatesManager />
        </div>
    );
}

export default EmailTemplatesPage;
