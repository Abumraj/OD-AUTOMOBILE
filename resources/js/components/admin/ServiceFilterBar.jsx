import React from 'react';

function ServiceFilterBar({ filters, onChange, columnLabel, columnPlaceholder, statusOptions }) {
    const update = (name, value) => onChange({ ...filters, [name]: value });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm mb-lg">
            <label className="text-xs text-on-surface-variant">
                From date
                <input type="date" value={filters.date_from} onChange={(event) => update('date_from', event.target.value)} className="w-full mt-xs bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm text-on-surface" />
            </label>
            <label className="text-xs text-on-surface-variant">
                To date
                <input type="date" value={filters.date_to} onChange={(event) => update('date_to', event.target.value)} className="w-full mt-xs bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm text-on-surface" />
            </label>
            <label className="text-xs text-on-surface-variant">
                Status
                <select value={filters.status} onChange={(event) => update('status', event.target.value)} className="w-full mt-xs bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm text-on-surface">
                    <option value="">All statuses</option>
                    {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
            </label>
            <label className="text-xs text-on-surface-variant">
                {columnLabel}
                <input type="text" value={filters.column} onChange={(event) => update('column', event.target.value)} placeholder={columnPlaceholder} className="w-full mt-xs bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm text-on-surface" />
            </label>
        </div>
    );
}

export default ServiceFilterBar;
