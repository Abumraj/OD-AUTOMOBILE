import React from 'react';
import ShipmentsManager from '../../components/admin/ShipmentsManager';

function AdminShipmentsPage() {
    return (
        <div className="space-y-gutter">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display-sm text-display-sm text-white mb-xs">Shipment Management</h1>
                    <p className="font-body-lg text-on-surface-variant">
                        Track and manage all shipments with real-time updates and customer notifications
                    </p>
                </div>
            </div>

            <ShipmentsManager />
        </div>
    );
}

export default AdminShipmentsPage;
