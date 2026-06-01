import React from 'react';
import LegalPagesManager from '../../components/admin/LegalPagesManager';

function AdminLegalPagesPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Legal Pages</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Manage privacy policy, terms of service, and other legal content
                </p>
            </div>

            <LegalPagesManager />
        </div>
    );
}

export default AdminLegalPagesPage;
