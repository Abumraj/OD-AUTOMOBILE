import React from 'react';
import ServicesManager from '../../components/admin/ServicesManager';

function AdminServicesPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Services</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Manage services displayed on the services page with YouTube video tutorials
                </p>
            </div>

            <ServicesManager />
        </div>
    );
}

export default AdminServicesPage;
