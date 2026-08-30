import React from 'react';
import ClearanceManager from '../../components/admin/ClearanceManager';

function ClearancePage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Clearance</h1>
                <p className="font-body-lg text-on-surface-variant">Manage shipment clearance status, shipping lines, payments, and profit.</p>
            </div>
            <ClearanceManager />
        </div>
    );
}

export default ClearancePage;