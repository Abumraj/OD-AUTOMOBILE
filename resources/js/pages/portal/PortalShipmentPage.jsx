import React, { useMemo, useState } from 'react';
import portalApi from '../../services/portalApi';
import SalesReceiptField from '../../components/SalesReceiptField';
import { usePortal } from '../../contexts/PortalContext';
import { rankItems } from '../../utils/vinSearch';
import { Card, DataTable, Empty, MatchTag, Notice, PageHeader, Pagination, ReferenceText, Spinner, StatTile, StatusBadge, ViewToggle, formatDate, formatMoney, titleCase, useLoad, usePagination, useViewMode } from '../../components/portal/ui';

// VIN is matched first; these are the properties searched after it.
const FIELDS = {
    primary: (item) => [item.vehicle, item.reference_default, item.tracking],
    secondary: (item) => [item.status, item.shipment_status, item.payment_status, item.trucking_fee_status, item.shipping_line, item.shipping_type, item.auction_site, item.origin, item.destination, item.location, item.color],
};

const EMPTY = { search: '', status: '', shipment_status: '', payment_status: '', fee_status: '', line: '', shipping_type: '', auction_site: '', from: '', to: '', sort: 'newest' };
const NO_LINE = 'none';

const selectClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface';

function Filter({ label, value, onChange, options, anyLabel = 'All' }) {
    if (options.length === 0) return null;
    return (
        <label className="block">
            <span className="mb-1 block text-sm text-on-surface-variant">{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
                <option value="">{anyLabel}</option>
                {options.map((option) => {
                    const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, titleCase(option)];
                    return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
                })}
            </select>
        </label>
    );
}

function dateOf(item) {
    return String(item.trucking_date || item.date || '').slice(0, 10);
}

function Details({ item }) {
    const { can } = usePortal();
    const rows = [
        ['VIN', item.vin], ['Colour', item.color], ['Auction site', item.auction_site ? titleCase(item.auction_site) : null],
        ['Pickup', item.origin], ['Delivered to', item.destination], ['Current location', item.location],
        ['Tracking', item.tracking], ['Shipping line', item.shipping_line], ['Shipping type', item.shipping_type ? titleCase(item.shipping_type) : null],
        ['Shipment status', item.shipment_status], ['Payment', item.payment_status], ['Shipping fee', item.trucking_fee_status ? titleCase(item.trucking_fee_status) : null],
        ['Shipping date', item.trucking_date ? formatDate(item.trucking_date) : null],
        ['Amount', item.amount !== null ? formatMoney(item.amount, 'USD') : null],
    ].filter(([, value]) => value);

    return (
        <div className="p-md">
            <dl className="grid gap-x-lg gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <dt className="text-xs uppercase text-on-surface-variant">{label}</dt>
                        <dd className={`break-words text-white ${label === 'VIN' ? 'font-mono' : ''}`}>{value}</dd>
                    </div>
                ))}
            </dl>
            {can('documents') && (
                <div className="mt-md">
                    <SalesReceiptField recordType="truckings" recordId={item.id} scope="portal" compact />
                </div>
            )}
        </div>
    );
}

export default function PortalShipmentPage() {
    const [mode, setMode] = useViewMode('shipment');
    const [filters, setFilters] = useState(EMPTY);
    const [expanded, setExpanded] = useState(null);
    const { data, error, loading } = useLoad(() => portalApi.get('/truckings'));

    const set = (key) => (value) => setFilters((current) => ({ ...current, [key]: value }));

    const results = useMemo(() => {
        if (!data) return [];

        let ranked = rankItems(data.items, filters.search, FIELDS);
        ranked = ranked.filter(({ item }) => {
            if (filters.status && item.status !== filters.status) return false;
            if (filters.shipment_status && item.shipment_status !== filters.shipment_status) return false;
            if (filters.payment_status && item.payment_status !== filters.payment_status) return false;
            if (filters.fee_status && item.trucking_fee_status !== filters.fee_status) return false;
            if (filters.shipping_type && item.shipping_type !== filters.shipping_type) return false;
            if (filters.auction_site && item.auction_site !== filters.auction_site) return false;
            if (filters.line === NO_LINE && item.shipping_line_id) return false;
            if (filters.line && filters.line !== NO_LINE && String(item.shipping_line_id) !== filters.line) return false;
            const date = dateOf(item);
            if (filters.from && (!date || date < filters.from)) return false;
            if (filters.to && (!date || date > filters.to)) return false;
            return true;
        });

        // While searching, the best match leads; otherwise order by date.
        if (!filters.search.trim()) {
            ranked.sort((a, b) => (filters.sort === 'oldest' ? 1 : -1) * dateOf(a.item).localeCompare(dateOf(b.item)));
        }

        return ranked;
    }, [data, filters]);

    const pager = usePagination(results, 10);
    const searching = filters.search.trim() !== '';
    const active = Object.entries(filters).some(([key, value]) => key !== 'sort' && value !== '');

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    const { facets } = data;
    const count = (predicate) => data.items.filter(predicate).length;

    return (
        <div className="space-y-md">
            <PageHeader
                title="Shipment"
                subtitle="Shipping jobs for your vehicles: pickup from the auction, delivery to the port, and what you owe."
                actions={<ViewToggle mode={mode} onChange={setMode} />}
            />

            {data.count > 0 && (
                <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
                    <StatTile label="Shipping jobs" value={data.count} icon="local_shipping" />
                    <StatTile label="Pending" value={count((item) => item.status === 'pending')} icon="hourglass_top" tone="text-amber-300" />
                    <StatTile label="Arrived at port" value={count((item) => item.status === 'arrived')} icon="task_alt" tone="text-green-400" />
                    <StatTile label="Shipping fee unpaid" value={count((item) => item.trucking_fee_status === 'unpaid')} icon="payments" tone={count((item) => item.trucking_fee_status === 'unpaid') ? 'text-amber-300' : 'text-white'} />
                </div>
            )}

            {data.count === 0 ? <Empty>No shipping jobs yet. They appear here once OD Automotive books one for you.</Empty> : (
                <>
                    <Card>
                        <div className="relative mb-md">
                            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                            <input
                                type="search"
                                value={filters.search}
                                onChange={(event) => set('search')(event.target.value)}
                                placeholder="Search by VIN, or by make, model, line, location, status…"
                                aria-label="Search shipments"
                                className="w-full rounded-lg border border-outline-variant bg-surface-container-high py-2.5 pl-11 pr-3 text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:outline-none"
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Filter label="Status" value={filters.status} onChange={set('status')} options={facets.statuses} anyLabel="All statuses" />
                            <Filter label="Shipment status" value={filters.shipment_status} onChange={set('shipment_status')} options={facets.shipment_statuses} anyLabel="Any" />
                            <Filter label="Payment" value={filters.payment_status} onChange={set('payment_status')} options={facets.payment_statuses} anyLabel="Any" />
                            <Filter label="Shipping fee" value={filters.fee_status} onChange={set('fee_status')} options={facets.fee_statuses} anyLabel="Any" />
                            <Filter
                                label="Shipping line"
                                value={filters.line}
                                onChange={set('line')}
                                options={[...facets.shipping_lines.map((line) => [String(line.id), line.name]), ...(facets.has_unassigned_line && facets.shipping_lines.length ? [[NO_LINE, 'Not assigned']] : [])]}
                                anyLabel="All lines"
                            />
                            <Filter label="Shipping type" value={filters.shipping_type} onChange={set('shipping_type')} options={facets.shipping_types} anyLabel="Any" />
                            <Filter label="Auction site" value={filters.auction_site} onChange={set('auction_site')} options={facets.auction_sites} anyLabel="Any" />
                            <label className="block">
                                <span className="mb-1 block text-sm text-on-surface-variant">Sort</span>
                                <select value={filters.sort} onChange={(event) => set('sort')(event.target.value)} className={selectClass} disabled={searching}>
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-sm text-on-surface-variant">Shipping date from</span>
                                <input type="date" value={filters.from} onChange={(event) => set('from')(event.target.value)} className={selectClass} />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-sm text-on-surface-variant">to</span>
                                <input type="date" value={filters.to} onChange={(event) => set('to')(event.target.value)} className={selectClass} />
                            </label>
                            {active && (
                                <div className="flex items-end">
                                    <button type="button" onClick={() => setFilters(EMPTY)} className="w-full rounded-lg border border-outline-variant px-md py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high">Clear filters</button>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 text-xs text-on-surface-variant">
                            {results.length} of {data.count} job{data.count === 1 ? '' : 's'}{searching ? '. VIN matches are listed first.' : '.'}
                        </div>
                    </Card>

                    {results.length === 0 ? <Empty>No shipping job matches these filters.</Empty> : (
                        <div className="space-y-2">
                            {mode === 'cards' ? (
                                <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
                                    {pager.rows.map(({ item, field }) => {
                                        const open = expanded === item.key;
                                        return (
                                            <div key={item.key} className={`overflow-hidden rounded-xl border bg-surface-container ${open ? 'border-secondary/50 md:col-span-2 xl:col-span-3' : 'border-white/10'}`}>
                                                <button onClick={() => setExpanded(open ? null : item.key)} className="block w-full p-md text-left hover:bg-surface-container-high">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="truncate font-semibold text-white">{item.vehicle || 'Vehicle'}</div>
                                                            <div className="truncate text-xs text-on-surface-variant"><ReferenceText item={item} /></div>
                                                        </div>
                                                        <StatusBadge status={item.status} />
                                                    </div>
                                                    {searching && <div className="mt-2"><MatchTag field={field} /></div>}
                                                    <div className="mt-3 space-y-1 text-xs text-on-surface-variant">
                                                        <div>{[item.origin, item.destination].filter(Boolean).join(' → ') || item.location || '—'}</div>
                                                        <div>{item.shipping_line || 'No shipping line yet'}{item.shipping_type ? ` · ${titleCase(item.shipping_type)}` : ''}</div>
                                                        <div className="flex items-center justify-between">
                                                            <span>{formatDate(item.trucking_date || item.date)}</span>
                                                            <span className="flex items-center gap-2">
                                                                {item.trucking_fee_status && <StatusBadge status={item.trucking_fee_status} />}
                                                                {item.amount !== null && <span className="text-sm font-semibold text-white">{formatMoney(item.amount, 'USD')}</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                                {open && <div className="border-t border-white/10"><Details item={item} /></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <DataTable columns={['#', 'VIN / reference', 'Vehicle', 'Date', 'Route', 'Shipping line', 'Status', 'Shipping fee', 'Payment', { label: 'Amount', right: true }, '']}>
                                    {pager.rows.map(({ item, field }, index) => {
                                        const open = expanded === item.key;
                                        return (
                                            <React.Fragment key={item.key}>
                                                <tr onClick={() => setExpanded(open ? null : item.key)} className="cursor-pointer hover:bg-surface-container-high">
                                                    <td className="w-12 px-md py-3 text-on-surface-variant">{pager.start + index + 1}</td>
                                                    <td className="px-md py-3 text-white"><ReferenceText item={item} />{searching && <div className="mt-1"><MatchTag field={field} /></div>}</td>
                                                    <td className="px-md py-3 text-on-surface">{item.vehicle || '—'}</td>
                                                    <td className="whitespace-nowrap px-md py-3 text-on-surface-variant">{formatDate(item.trucking_date || item.date)}</td>
                                                    <td className="px-md py-3 text-on-surface-variant">{[item.origin, item.destination].filter(Boolean).join(' → ') || item.location || '—'}</td>
                                                    <td className="px-md py-3 text-on-surface">{item.shipping_line || '—'}</td>
                                                    <td className="px-md py-3"><StatusBadge status={item.status} />{item.shipment_status && <div className="mt-1 text-xs text-on-surface-variant">{item.shipment_status}</div>}</td>
                                                    <td className="px-md py-3">{item.trucking_fee_status ? <StatusBadge status={item.trucking_fee_status} /> : '—'}</td>
                                                    <td className="px-md py-3">{item.payment_status ? <StatusBadge status={item.payment_status} /> : '—'}</td>
                                                    <td className="whitespace-nowrap px-md py-3 text-right text-white">{item.amount !== null ? formatMoney(item.amount, 'USD') : '—'}</td>
                                                    <td className="px-md py-3 text-right"><span className="material-symbols-outlined text-on-surface-variant">{open ? 'expand_less' : 'expand_more'}</span></td>
                                                </tr>
                                                {open && (
                                                    <tr className="bg-surface-container-low"><td colSpan={11}><Details item={item} /></td></tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </DataTable>
                            )}

                            <Pagination pager={pager} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
