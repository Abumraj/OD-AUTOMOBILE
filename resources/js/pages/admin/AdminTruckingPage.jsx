import React from 'react';
import TruckingManager from '../../components/admin/TruckingManager';

function AdminTruckingPage() {
    return (
        <div className="space-y-gutter">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display-sm text-display-sm text-white mb-xs">Trucking Management</h1>
                    <p className="font-body-lg text-on-surface-variant">
                        Track trucking jobs, auction pickups, shipping method, fee status, and route progress.
                    </p>
                </div>
            </div>

            <TruckingManager />
        </div>
    );
}

export default AdminTruckingPage;
