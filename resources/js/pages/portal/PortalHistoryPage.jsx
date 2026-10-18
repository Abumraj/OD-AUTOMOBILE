import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import portalApi from '../../services/portalApi';
import SalesReceiptField from '../../components/SalesReceiptField';
import { usePortal } from '../../contexts/PortalContext';
import { Card, DataTable, Empty, Notice, PageHeader, ReferenceText, Spinner, StatusBadge, TextInput, ViewToggle, formatDate, titleCase, useLoad, useViewMode } from '../../components/portal/ui';

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

function ItemDetails({ item, onReorder }) {
    const { can } = usePortal();

    return (
        <div className="p-md">
            <dl className="grid gap-x-lg gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                {item.vin && (
                    <div><dt className="text-xs uppercase text-on-surface-variant">VIN</dt><dd className="break-words font-mono text-white">{item.vin}</dd></div>
                )}
                {Object.entries(item.details)
                    .filter(([key, value]) => !DETAIL_SKIP.includes(key) && !['vin', 'vehicle_vin'].includes(key) && value !== null && value !== '')
                    .map(([key, value]) => (
                        <div key={key}>
                            <dt className="text-xs uppercase text-on-surface-variant">{titleCase(key)}</dt>
                            <dd className="break-words text-white">{String(value)}</dd>
                        </div>
                    ))}
            </dl>

            {can('documents') && (
                <div className="mt-md">
                    <SalesReceiptField recordType={item.table} recordId={item.id} scope="portal" compact />
                </div>
            )}

            <div className="mt-md flex flex-wrap gap-3">
                {item.type === 'shipment' && <Link to={`/portal/vehicles/${item.id}`} className="text-sm font-semibold text-secondary hover:underline">Open tracking & documents</Link>}
                {['quote', 'shipment', 'procurement', 'trucking', 'clearance', 'auction'].includes(item.type) && (
                    <button onClick={() => onReorder(item)} className="text-sm font-semibold text-secondary hover:underline">Request this again</button>
                )}
            </div>
        </div>
    );
}

export default function PortalHistoryPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useViewMode('history');
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
                subtitle="Every service OD Automotive has rendered for your business. Vehicles are identified by VIN where one is on file."
                actions={(
                    <>
                        <ViewToggle mode={mode} onChange={setMode} />
                        <a href={exportUrl} className="rounded-lg border border-outline-variant px-md py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high">Export CSV</a>
                    </>
                )}
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

                    {mode === 'cards' ? data.items.map((item) => {
                        const open = expanded === item.key;
                        return (
                            <div key={item.key} className="overflow-hidden rounded-xl border border-white/10 bg-surface-container">
                                <button onClick={() => setExpanded(open ? null : item.key)} className="flex w-full items-center justify-between gap-3 p-md text-left hover:bg-surface-container-high">
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold text-white">{item.label} · {item.vehicle || item.reference}</div>
                                        <div className="text-xs text-on-surface-variant"><ReferenceText item={item} /> · {formatDate(item.date)}</div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        {item.receipts > 0 && <span className="material-symbols-outlined text-base text-on-surface-variant" title="Sales receipt on file">receipt_long</span>}
                                        {item.amount !== null && <span className="hidden text-sm text-on-surface sm:inline">{Number(item.amount).toLocaleString()}</span>}
                                        <StatusBadge status={item.status} />
                                        <span className="material-symbols-outlined text-on-surface-variant">{open ? 'expand_less' : 'expand_more'}</span>
                                    </div>
                                </button>
                                {open && <div className="border-t border-white/10"><ItemDetails item={item} onReorder={reorder} /></div>}
                            </div>
                        );
                    }) : (
                        <DataTable columns={['Service', 'VIN / reference', 'Vehicle', 'Status', 'Date', { label: 'Amount', right: true }, { label: 'Receipt', right: true }, '']}>
                            {data.items.map((item) => {
                                const open = expanded === item.key;
                                return (
                                    <React.Fragment key={item.key}>
                                        <tr onClick={() => setExpanded(open ? null : item.key)} className="cursor-pointer hover:bg-surface-container-high">
                                            <td className="px-md py-3 font-semibold text-white">{item.label}</td>
                                            <td className="px-md py-3 text-on-surface"><ReferenceText item={item} /></td>
                                            <td className="px-md py-3 text-on-surface">{item.vehicle || '—'}</td>
                                            <td className="px-md py-3"><StatusBadge status={item.status} /></td>
                                            <td className="whitespace-nowrap px-md py-3 text-on-surface-variant">{formatDate(item.date)}</td>
                                            <td className="px-md py-3 text-right text-on-surface">{item.amount !== null ? Number(item.amount).toLocaleString() : '—'}</td>
                                            <td className="px-md py-3 text-right text-on-surface-variant">{item.receipts > 0 ? `${item.receipts} on file` : '—'}</td>
                                            <td className="px-md py-3 text-right"><span className="material-symbols-outlined text-on-surface-variant">{open ? 'expand_less' : 'expand_more'}</span></td>
                                        </tr>
                                        {open && (
                                            <tr className="bg-surface-container-low">
                                                <td colSpan={8}><ItemDetails item={item} onReorder={reorder} /></td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </DataTable>
                    )}
                </div>
            ))}
        </div>
    );
}
