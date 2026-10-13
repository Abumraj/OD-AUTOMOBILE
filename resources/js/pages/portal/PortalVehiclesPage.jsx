import React from 'react';
import { Link, useParams } from 'react-router-dom';
import portalApi from '../../services/portalApi';
import { Card, Empty, Notice, PageHeader, ProgressBar, Spinner, StatusBadge, formatDate, formatMoney, titleCase, useLoad } from '../../components/portal/ui';

export function PortalVehiclesPage() {
    const { data, error, loading } = useLoad(() => portalApi.get('/vehicles'));

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    return (
        <div className="space-y-md">
            <PageHeader title="Vehicles" subtitle="Live status for every vehicle OD is handling for you." />

            {data.items.length === 0 ? <Empty>No vehicles yet.</Empty> : (
                <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
                    {data.items.map((item) => (
                        <Link key={item.key} to={`/portal/vehicles/${item.id}`} className="block rounded-xl border border-white/10 bg-surface-container p-md transition hover:border-secondary/60">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="truncate font-semibold text-white">{item.vehicle || 'Vehicle'}</div>
                                    <div className="text-xs text-on-surface-variant">{item.reference}{item.vin ? ` · ${item.vin}` : ''}</div>
                                </div>
                                <StatusBadge status={item.status} />
                            </div>
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
            )}
        </div>
    );
}

export function PortalVehicleDetailPage() {
    const { id } = useParams();
    const { data, error, loading } = useLoad(() => portalApi.get(`/vehicles/${id}`), [id]);

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    const { vehicle, updates, dock_receipts: receipts, documents, invoices, tickets } = data;
    const details = vehicle.details;

    return (
        <div className="space-y-md">
            <Link to="/portal/vehicles" className="text-sm text-secondary hover:underline">← All vehicles</Link>
            <PageHeader title={vehicle.vehicle || vehicle.reference} subtitle={`${vehicle.reference}${vehicle.vin ? ` · VIN ${vehicle.vin}` : ''}`} actions={<StatusBadge status={vehicle.status} />} />

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
