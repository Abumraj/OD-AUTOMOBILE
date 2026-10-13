import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import portalApi from '../../services/portalApi';
import { Card, Empty, Notice, PageHeader, Spinner, StatusBadge, TextInput, formatDate, titleCase, useLoad } from '../../components/portal/ui';

const TYPES = [
    ['', 'All services'],
    ['quote', 'Quotes'],
    ['shipment', 'Shipments'],
    ['procurement', 'Procurement'],
    ['autosale', 'Autosales'],
    ['trucking', 'Trucking'],
    ['clearance', 'Clearance'],
    ['auction', 'Auction requests'],
];

const DETAIL_SKIP = ['id', 'customer_name', 'customer_email', 'client_name', 'client_email', 'email', 'phone'];

export default function PortalHistoryPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({ type: '', search: '', from: '', to: '' });
    const [applied, setApplied] = useState(filters);
    const [expanded, setExpanded] = useState(null);
    const { data, error, loading } = useLoad(() => portalApi.get('/history', applied), [JSON.stringify(applied)]);

    const set = (key) => (event) => setFilters({ ...filters, [key]: event.target.value });
    const submit = (event) => {
        event.preventDefault();
        setApplied(filters);
    };

    const exportUrl = portalApi.url('/history/export', applied);

    const reorder = async (item) => {
        try {
            const result = await portalApi.get(`/reorder/${item.type}/${item.id}`);
            navigate('/portal/requests', { state: { prefill: result } });
        } catch (caught) {
            window.alert(caught.message);
        }
    };

    return (
        <div className="space-y-md">
            <PageHeader
                title="Service history"
                subtitle="Every service OD Automotive has rendered for your business."
                actions={<a href={exportUrl} className="rounded-lg border border-outline-variant px-md py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high">Export CSV</a>}
            />

            <Card>
                <form onSubmit={submit} className="grid gap-3 md:grid-cols-5">
                    <label className="block md:col-span-1">
                        <span className="mb-1 block text-sm text-on-surface-variant">Service</span>
                        <select value={filters.type} onChange={set('type')} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface">
                            {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                    <TextInput label="Search" placeholder="VIN, vehicle, reference" value={filters.search} onChange={set('search')} />
                    <TextInput label="From" type="date" value={filters.from} onChange={set('from')} />
                    <TextInput label="To" type="date" value={filters.to} onChange={set('to')} />
                    <div className="flex items-end">
                        <button className="w-full rounded-lg bg-secondary px-md py-2 text-sm font-semibold text-on-secondary">Apply</button>
                    </div>
                </form>
            </Card>

            {loading && <Spinner />}
            {error && <Notice tone="error">{error}</Notice>}

            {data && (data.items.length === 0 ? <Empty>No services match these filters.</Empty> : (
                <div className="space-y-2">
                    <div className="text-sm text-on-surface-variant">{data.count} record{data.count === 1 ? '' : 's'}</div>
                    {data.items.map((item) => {
                        const open = expanded === item.key;
                        return (
                            <div key={item.key} className="overflow-hidden rounded-xl border border-white/10 bg-surface-container">
                                <button onClick={() => setExpanded(open ? null : item.key)} className="flex w-full items-center justify-between gap-3 p-md text-left hover:bg-surface-container-high">
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold text-white">{item.label} · {item.vehicle || item.reference}</div>
                                        <div className="text-xs text-on-surface-variant">
                                            {item.reference}{item.vin ? ` · VIN ${item.vin}` : ''} · {formatDate(item.date)}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        {item.amount !== null && <span className="hidden text-sm text-on-surface sm:inline">{Number(item.amount).toLocaleString()}</span>}
                                        <StatusBadge status={item.status} />
                                        <span className="material-symbols-outlined text-on-surface-variant">{open ? 'expand_less' : 'expand_more'}</span>
                                    </div>
                                </button>
                                {open && (
                                    <div className="border-t border-white/10 p-md">
                                        <dl className="grid gap-x-lg gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                                            {Object.entries(item.details).filter(([key, value]) => !DETAIL_SKIP.includes(key) && value !== null && value !== '').map(([key, value]) => (
                                                <div key={key}>
                                                    <dt className="text-xs uppercase text-on-surface-variant">{titleCase(key)}</dt>
                                                    <dd className="break-words text-white">{String(value)}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                        <div className="mt-md flex flex-wrap gap-3">
                                            {item.type === 'shipment' && <Link to={`/portal/vehicles/${item.id}`} className="text-sm font-semibold text-secondary hover:underline">Open tracking & documents</Link>}
                                            {['quote', 'shipment', 'procurement', 'trucking', 'clearance', 'auction'].includes(item.type) && (
                                                <button onClick={() => reorder(item)} className="text-sm font-semibold text-secondary hover:underline">Request this again</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
