import React from 'react';
import ContactMessagesManager from '../../components/admin/ContactMessagesManager';

function AdminMessagesPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Contact Messages</h1>
                <p className="font-body-lg text-on-surface-variant">
                    View and respond to customer inquiries and contact form submissions
                </p>
            </div>

            <ContactMessagesManager />
        </div>
    );
}

export default AdminMessagesPage;
