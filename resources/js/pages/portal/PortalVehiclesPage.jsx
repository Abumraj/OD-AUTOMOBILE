import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import portalApi from '../../services/portalApi';
import SalesReceiptField from '../../components/SalesReceiptField';
import { usePortal } from '../../contexts/PortalContext';
import { Card, DataTable, Empty, Notice, PageHeader, ProgressBar, ReferenceText, Spinner, StatusBadge, ViewToggle, formatDate, formatMoney, titleCase, useLoad, useViewMode } from '../../components/portal/ui';

/** Lower-case and drop spaces/dashes so "1hgcm 82633a" still finds a VIN. */
const squash = (value) => String(value ?? '').toLowerCase().replace(/[\s\-_/.]+/g, '');

/**
 * How well one search term matches a vehicle. The VIN is the primary key, so any VIN match
 * outranks every match on the other properties. Returns { score, field } or null.
 */
function matchTerm(item, term) {
    const vin = squash(item.vin);
    if (vin) {
        if (vin === term) return { score: 1000, field: 'VIN' };
        if (vin.startsWith(term)) return { score: 900, field: 'VIN' };
        if (vin.endsWith(term)) return { score: 850, field: 'VIN' };
        if (vin.includes(term)) return { score: 800, field: 'VIN' };
    }

    const primary = [item.vehicle, item.reference_default, item.details?.reference_number, item.details?.tracking_number].map(squash);
    if (primary.some((value) => value && value.includes(term))) return { score: 200, field: 'Vehicle or reference' };

    const d = item.details || {};
    const secondary = [item.status, item.route, d.vessel_name, d.container_number, d.booking_number, d.shipping_provider, d.origin_port, d.destination_port, d.origin_country, d.destination_country, d.car_color, d.vehicle_make, d.vehicle_model, d.vehicle_year, d.year, d.car_model]
        .map(squash);
    if (secondary.some((value) => value && value.includes(term))) return { score: 100, field: 'Other details' };

    return null;
}

/** Every word must match something; the VIN-heavy matches float to the top. */
function rankVehicles(items, query) {
    const terms = query.split(/\s+/).map(squash).filter(Boolean);
    if (terms.length === 0) return items.map((item) => ({ item, field: null }));

    return items
        .map((item, index) => {
            const hits = terms.map((term) => matchTerm(item, term));
            if (hits.some((hit) => hit === null)) return null;
            const best = hits.reduce((top, hit) => (hit.score > top.score ? hit : top), hits[0]);
            return { item, index, field: best.field, score: hits.reduce((sum, hit) => sum + hit.score, 0) };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || a.index - b.index);
}

function MatchTag({ field }) {
    if (!field) return null;
    return (
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${field === 'VIN' ? 'border-secondary/50 text-secondary' : 'border-white/15 text-on-surface-variant'}`}>
            {field === 'VIN' ? 'VIN match' : field}
        </span>
    );
}

export function PortalVehiclesPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useViewMode('vehicles');
    const [query, setQuery] = useState('');
    const { data, error, loading } = useLoad(() => portalApi.get('/vehicles'));
    const results = useMemo(() => rankVehicles(data?.items || [], query), [data, query]);
    const searching = query.trim() !== '';

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    return (
        <div className="space-y-md">
            <PageHeader
                title="Vehicles"
                subtitle="Live status for every vehicle OD is handling for you, identified by VIN."
                actions={<ViewToggle mode={mode} onChange={setMode} />}
            />

            {data.items.length > 0 && (
                <div className="space-y-1">
                    <div className="relative">
                        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by VIN, or by make, model, vessel, container, status…"
                            aria-label="Search vehicles"
                            className="w-full rounded-lg border border-outline-variant bg-surface-container-high py-2.5 pl-11 pr-10 text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:outline-none"
                        />
                        {searching && (
                            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        )}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                        {searching ? `${results.length} of ${data.items.length} vehicle${data.items.length === 1 ? '' : 's'}. VIN matches are listed first.` : 'Tip: a full VIN, its last 6 characters or any part of it works.'}
                    </div>
                </div>
            )}

            {data.items.length === 0 ? <Empty>No vehicles yet.</Empty> : results.length === 0 ? (
                <Empty>No vehicle matches “{query.trim()}”. Check the VIN or try the make, model or vessel name.</Empty>
            ) : mode === 'cards' ? (
                <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
                    {results.map(({ item, field }) => (
                        <Link key={item.key} to={`/portal/vehicles/${item.id}`} className="block rounded-xl border border-white/10 bg-surface-container p-md transition hover:border-secondary/60">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="truncate font-semibold text-white">{item.vehicle || 'Vehicle'}</div>
                                    <div className="truncate text-xs text-on-surface-variant"><ReferenceText item={item} /></div>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>
                            {searching && <div className="mt-2"><MatchTag field={field} /></div>}
                            <div className="mt-3"><ProgressBar value={item.progress} /></div>
                            <div className="mt-2 flex justify-between text-xs text-on-surface-variant">
                                <span>{item.route || '—'}</span>
                                <span>{item.progress}%</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-on-surface-variant">ETA {formatDate(item.eta)}</span>
                                {item.delayed && <span className="font-semibold text-amber-300">Delayed</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <DataTable columns={['VIN / reference', 'Vehicle', 'Route', 'Status', { label: 'Progress', right: true }, 'ETA', { label: 'Receipt', right: true }]}>
                    {results.map(({ item, field }) => (
                        <tr key={item.key} onClick={() => navigate(`/portal/vehicles/${item.id}`)} className="cursor-pointer hover:bg-surface-container-high">
                            <td className="px-md py-3 text-white"><ReferenceText item={item} />{searching && <div className="mt-1"><MatchTag field={field} /></div>}</td>
                            <td className="px-md py-3 text-on-surface">{item.vehicle || '—'}</td>
                            <td className="px-md py-3 text-on-surface-variant">{item.route || '—'}</td>
                            <td className="px-md py-3"><StatusBadge status={item.status} /></td>
                            <td className="px-md py-3 text-right text-on-surface">{item.progress}%</td>
                            <td className="px-md py-3 text-on-surface-variant">{formatDate(item.eta)}{item.delayed && <span className="ml-2 font-semibold text-amber-300">Delayed</span>}</td>
                            <td className="px-md py-3 text-right text-on-surface-variant">{item.receipts ? `${item.receipts} on file` : '—'}</td>
                        </tr>
                    ))}
                </DataTable>
            )}
        </div>
    );
}

export function PortalVehicleDetailPage() {
    const { id } = useParams();
    const { can } = usePortal();
    const { data, error, loading } = useLoad(() => portalApi.get(`/vehicles/${id}`), [id]);

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    const { vehicle, updates, dock_receipts: receipts, documents, invoices, tickets } = data;
    const details = vehicle.details;

    return (
        <div className="space-y-md">
            <Link to="/portal/vehicles" className="text-sm text-secondary hover:underline">← All vehicles</Link>
            <PageHeader
                title={vehicle.vehicle || vehicle.reference}
                subtitle={vehicle.reference_is_vin ? `VIN ${vehicle.vin} · ${vehicle.reference_default}` : vehicle.reference}
                actions={<StatusBadge status={vehicle.status} />}
            />

            {vehicle.delayed && <Notice tone="warning">This shipment is past its estimated arrival date. OD Automotive is following up.</Notice>}

            <Card title="Progress">
                <ProgressBar value={vehicle.progress} />
                <div className="mt-2 text-sm text-on-surface-variant">{vehicle.progress}% complete</div>
                <dl className="mt-md grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ['From', details.origin_port],
                        ['To', details.destination_port],
                        ['Vessel', details.vessel_name],
                        ['Container', details.container_number],
                        ['Booking', details.booking_number],
                        ['Shipping line', details.shipping_provider],
                        ['ETA', formatDate(details.estimated_arrival_date || details.eta)],
                        ['Arrived', details.actual_arrival_date ? formatDate(details.actual_arrival_date) : null],
                    ].filter(([, value]) => value && value !== '—').map(([label, value]) => (
                        <div key={label}><dt className="text-xs uppercase text-on-surface-variant">{label}</dt><dd className="text-white">{value}</dd></div>
                    ))}
                </dl>
            </Card>

            <div className="grid gap-md lg:grid-cols-2">
                <Card title="Timeline">
                    {updates.length === 0 ? <Empty>No tracking updates yet.</Empty> : (
                        <ol className="relative ml-2 space-y-4 border-l border-white/15 pl-4">
                            {updates.map((update, index) => (
                                <li key={index}>
                                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-secondary" />
                                    <div className="font-semibold text-white">{titleCase(update.status)}</div>
                                    <div className="text-sm text-on-surface-variant">{update.description}</div>
                                    <div className="text-xs text-on-surface-variant/70">{[update.location, formatDate(update.update_date)].filter(Boolean).join(' · ')}</div>
                                </li>
                            ))}
                        </ol>
                    )}
                </Card>

                <div className="space-y-md">
                    <Card title="Vehicle sales receipt">
                        {can('documents')
                            ? <SalesReceiptField recordType="shipments" recordId={vehicle.id} scope="portal" compact />
                            : <p className="text-sm text-on-surface-variant">Your role cannot upload documents.</p>}
                    </Card>

                    <Card title="Documents">
                        {receipts.length + documents.length === 0 ? <Empty>No documents attached yet.</Empty> : (
                            <ul className="divide-y divide-white/10">
                                {receipts.map((receipt) => (
                                    <li key={`r${receipt.id}`} className="flex items-center justify-between py-2">
                                        <span className="text-white">Dock receipt {receipt.receipt_number} <span className="text-xs text-on-surface-variant">({titleCase(receipt.stage)})</span></span>
                                        <a className="text-sm text-secondary hover:underline" href={portalApi.url(`/dock-receipts/${receipt.id}/download`)}>Download</a>
                                    </li>
                                ))}
                                {documents.map((doc) => (
                                    <li key={`d${doc.id}`} className="flex items-center justify-between py-2">
                                        <span className="text-white">{doc.title}</span>
                                        <a className="text-sm text-secondary hover:underline" href={portalApi.url(`/documents/${doc.id}/download`)}>Download</a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card title="Invoices">
                        {invoices.length === 0 ? <Empty>No invoices for this vehicle.</Empty> : (
                            <ul className="divide-y divide-white/10">
                                {invoices.map((invoice) => (
                                    <li key={invoice.id} className="flex items-center justify-between gap-3 py-2">
                                        <span className="text-white">{invoice.invoice_number} · {formatMoney(invoice.amount, 'NGN')}</span>
                                        <span className="flex items-center gap-3">
                                            <StatusBadge status={invoice.status} />
                                            <a className="text-sm text-secondary hover:underline" href={portalApi.url(`/invoices/${invoice.id}/download`)}>PDF</a>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card title="Questions about this vehicle" action={<Link className="text-sm text-secondary hover:underline" to={`/portal/tickets?record=shipments:${vehicle.id}`}>Ask a question</Link>}>
                        {tickets.length === 0 ? <div className="text-sm text-on-surface-variant">No open questions.</div> : (
                            <ul className="space-y-2">
                                {tickets.map((ticket) => (
                                    <li key={ticket.id}><Link className="text-secondary hover:underline" to={`/portal/tickets/${ticket.id}`}>{ticket.ticket_number}: {ticket.subject}</Link> <StatusBadge status={ticket.status} /></li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
