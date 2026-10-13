import React from 'react';
import { Link } from 'react-router-dom';
import portalApi from '../../services/portalApi';
import { usePortal } from '../../contexts/PortalContext';
import { Card, Empty, Notice, PageHeader, Spinner, StatTile, StatusBadge, formatDate, formatMoney, titleCase, useLoad } from '../../components/portal/ui';

const severityTone = { critical: 'error', warning: 'warning', info: 'info' };

export default function PortalDashboardPage() {
    const { customer, user, config } = usePortal();
    const { data, error, loading } = useLoad(() => portalApi.get('/dashboard'));

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    const { counts, alerts, recent, outstanding_by_currency: outstanding, credit_balance: credit, tier } = data;

    return (
        <div className="space-y-gutter">
            <PageHeader
                title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}`}
                subtitle={`${customer?.company_name} · ${tier?.label || titleCase(customer?.pricing_tier || 'standard')} tier${tier?.discount_percent ? ` (${tier.discount_percent}% volume discount)` : ''}`}
            />

            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((alert, index) => (
                        <Link key={index} to={alert.link} className="block">
                            <Notice tone={severityTone[alert.severity] || 'info'}>
                                <strong>{alert.title}.</strong> {alert.message}
                            </Notice>
                        </Link>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
                <StatTile label="Services rendered" value={counts.total_services} icon="inventory_2" />
                <StatTile label="Vehicles in progress" value={counts.active_shipments} icon="local_shipping" tone="text-secondary" />
                <StatTile label="Delivered" value={counts.delivered} icon="task_alt" tone="text-green-400" />
                <StatTile label="Open invoices" value={counts.open_invoices} icon="receipt_long" tone={counts.open_invoices ? 'text-amber-300' : 'text-white'} />
            </div>

            <div className="grid gap-md lg:grid-cols-3">
                <Card title="Balance" className="lg:col-span-1">
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs uppercase text-on-surface-variant">Outstanding</div>
                            {outstanding.length === 0
                                ? <div className="text-xl font-bold text-green-400">Nothing due</div>
                                : outstanding.map((row) => <div key={row.currency} className="text-xl font-bold text-white">{formatMoney(row.amount, row.currency)}</div>)}
                        </div>
                        <div>
                            <div className="text-xs uppercase text-on-surface-variant">Account credit</div>
                            <div className="text-lg font-semibold text-white">{formatMoney(credit, config?.currency || 'NGN')}</div>
                        </div>
                        <Link to="/portal/invoices" className="inline-block text-sm text-secondary hover:underline">View invoices →</Link>
                    </div>
                </Card>

                <Card title="Recent activity" className="lg:col-span-2" action={<Link to="/portal/history" className="text-sm text-secondary hover:underline">See all</Link>}>
                    {recent.length === 0 ? (
                        <Empty>Nothing here yet. Services OD handles for you will appear automatically.</Empty>
                    ) : (
                        <ul className="divide-y divide-white/10">
                            {recent.map((item) => (
                                <li key={item.key} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold text-white">{item.label} · {item.vehicle || item.reference}</div>
                                        <div className="text-xs text-on-surface-variant">{item.reference} · {formatDate(item.date)}</div>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            <Card title="Quick actions">
                <div className="flex flex-wrap gap-3">
                    <Link to="/portal/requests" className="rounded-lg bg-secondary px-md py-2 text-sm font-semibold text-on-secondary">Request a service</Link>
                    <Link to="/portal/vehicles" className="rounded-lg border border-outline-variant px-md py-2 text-sm font-semibold text-on-surface">Track a vehicle</Link>
                    <Link to="/portal/tickets" className="rounded-lg border border-outline-variant px-md py-2 text-sm font-semibold text-on-surface">Ask a question</Link>
                </div>
            </Card>
        </div>
    );
}
