import React from 'react';

/** Payment states shared by every service that tracks one. */
export const PAYMENT_OPTIONS = [
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
];

const UPDATED_OPTIONS = [
    { value: '', label: 'Any time' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
];

/**
 * Adds the shared "payment status" and "recently updated" filters to a list request.
 * Choosing "Recently updated first" overrides the page's own sort.
 */
export function appendListFilters(params, filters) {
    params.set('payment_status', filters.payment_status || '');
    params.set('updated_within', filters.updated_within || '');
    if (filters.sort === 'updated') {
        params.set('sort_by', 'updated_at');
        params.set('sort_order', 'desc');
    }
}

const fieldClass = 'w-full mt-xs bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm text-on-surface';

function ServiceFilterBar({ filters, onChange, columnLabel, columnPlaceholder, statusOptions, showEta = false, paymentOptions = null }) {
    const update = (name, value) => onChange({ ...filters, [name]: value });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-sm mb-lg">
            <label className="text-xs text-on-surface-variant">
                From date
                <input type="date" value={filters.date_from} onChange={(event) => update('date_from', event.target.value)} className={fieldClass} />
            </label>
            <label className="text-xs text-on-surface-variant">
                To date
                <input type="date" value={filters.date_to} onChange={(event) => update('date_to', event.target.value)} className={fieldClass} />
            </label>
            {showEta && <>
                <label className="text-xs text-on-surface-variant">
                    ETA from
                    <input type="date" value={filters.eta_from} onChange={(event) => update('eta_from', event.target.value)} className={fieldClass} />
                </label>
                <label className="text-xs text-on-surface-variant">
                    ETA to
                    <input type="date" value={filters.eta_to} onChange={(event) => update('eta_to', event.target.value)} className={fieldClass} />
                </label>
            </>}
            <label className="text-xs text-on-surface-variant">
                Status
                <select value={filters.status} onChange={(event) => update('status', event.target.value)} className={fieldClass}>
                    <option value="">All statuses</option>
                    {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
            </label>
            {paymentOptions && (
                <label className="text-xs text-on-surface-variant">
                    Payment status
                    <select value={filters.payment_status ?? ''} onChange={(event) => update('payment_status', event.target.value)} className={fieldClass}>
                        <option value="">All payments</option>
                        {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
            )}
            <label className="text-xs text-on-surface-variant">
                Shipping type
                <select value={filters.shipping_type} onChange={(event) => update('shipping_type', event.target.value)} className={fieldClass}>
                    <option value="">All types</option>
                    <option value="container">Container</option>
                    <option value="roro">RoRo</option>
                </select>
            </label>
            <label className="text-xs text-on-surface-variant">
                {columnLabel}
                <input type="text" value={filters.column} onChange={(event) => update('column', event.target.value)} placeholder={columnPlaceholder} className={fieldClass} />
            </label>
            <label className="text-xs text-on-surface-variant">
                Recently updated
                <select value={filters.updated_within ?? ''} onChange={(event) => update('updated_within', event.target.value)} className={fieldClass}>
                    {UPDATED_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
            </label>
            <label className="text-xs text-on-surface-variant">
                Sort by
                <select value={filters.sort ?? ''} onChange={(event) => update('sort', event.target.value)} className={fieldClass}>
                    <option value="">Default order</option>
                    <option value="updated">Recently updated first</option>
                </select>
            </label>
        </div>
    );
}

export default ServiceFilterBar;
