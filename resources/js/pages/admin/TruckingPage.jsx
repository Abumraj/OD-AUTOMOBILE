import React from 'react';
import TruckingManager from '../../components/admin/TruckingManager';

function TruckingPage() {
    return (
        <div className="space-y-gutter">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display-sm text-display-sm text-white mb-xs">Trucking</h1>
                    <p className="font-body-lg text-on-surface-variant">
                        Manage trucking jobs, fee status, and shipment progress for outbound vehicle movement.
                    </p>
                </div>
            </div>

            <TruckingManager />
        </div>
    );
}

export default TruckingPage;
