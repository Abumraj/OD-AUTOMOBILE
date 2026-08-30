import React from 'react';
import ProcurementManager from '../../components/admin/ProcurementManager';

function ProcurementPage() {
    return (
        <div className="space-y-gutter">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display-sm text-display-sm text-white mb-xs">Procurement</h1>
                    <p className="font-body-lg text-on-surface-variant">
                        Manage vehicle sourcing requests, auction purchases, and procurement status.
                    </p>
                </div>
            </div>

            <ProcurementManager />
        </div>
    );
}

export default ProcurementPage;
