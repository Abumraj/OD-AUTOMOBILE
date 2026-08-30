import React from 'react';
import AutosalesManager from '../../components/admin/AutosalesManager';

function AutosalesPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Autosales</h1>
                <p className="font-body-lg text-on-surface-variant">Manage completed vehicle sales, including outright and swap transactions.</p>
            </div>
            <AutosalesManager />
        </div>
    );
}

export default AutosalesPage;