import React from 'react';
import ShippingTypesManager from '../../../components/admin/ShippingTypesManager';
import ShippingLinesManager from '../../../components/admin/ShippingLinesManager';
import ShipmentImportExport from '../../../components/admin/ShipmentImportExport';

function ShippingConfigPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Shipping Configuration</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Manage shipping types, lines, and bulk import/export shipment data
                </p>
            </div>

            <ShipmentImportExport />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
                <ShippingTypesManager />
                <ShippingLinesManager />
            </div>
        </div>
    );
}

export default ShippingConfigPage;
