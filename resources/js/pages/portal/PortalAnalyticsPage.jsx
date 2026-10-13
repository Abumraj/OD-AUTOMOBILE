import React from 'react';
import portalApi from '../../services/portalApi';
import { Card, Empty, Notice, PageHeader, Spinner, StatTile, formatMoney, titleCase, useLoad } from '../../components/portal/ui';

function BarList({ rows, labelKey, currency }) {
    const max = Math.max(...rows.map((row) => row.amount), 1);
    return (
        <ul className="space-y-3">
            {rows.map((row, index) => (
                <li key={`${row[labelKey]}-${index}`}>
                    <div className="mb-1 flex justify-between text-sm">
                        <span className="truncate text-on-surface">{row[labelKey]}</span>
                        <span className="text-white">{formatMoney(row.amount, currency)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${(row.amount / max) * 100}%` }} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default function PortalAnalyticsPage() {
    const { data, error, loading } = useLoad(() => portalApi.get('/analytics'));

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    const currencies = data.by_currency.map((row) => row.currency);

    return (
        <div className="space-y-md">
            <PageHeader title="Analytics" subtitle="Spend, costs and delivery performance. Currencies are never mixed." />

            <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Vehicles handled" value={data.vehicle_count} icon="directions_car" />
                <StatTile label="Invoices" value={data.invoice_count} icon="receipt_long" />
                <StatTile label="Avg. transit time" value={data.average_transit_days !== null ? `${data.average_transit_days} days` : '—'} icon="schedule" />
                <StatTile label="Currencies" value={currencies.join(' · ') || '—'} icon="payments" />
            </div>

            {data.by_currency.length === 0 ? <Empty>Spending figures appear once invoices are issued.</Empty> : data.by_currency.map((row) => (
                <div key={row.currency} className="space-y-md">
                    <h2 className="text-lg font-semibold text-white">{row.currency}</h2>
                    <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
                        <StatTile label="Invoiced" value={formatMoney(row.invoiced, row.currency)} />
                        <StatTile label="Paid" value={formatMoney(row.paid, row.currency)} tone="text-green-400" />
                        <StatTile label="Outstanding" value={formatMoney(row.outstanding, row.currency)} tone={row.outstanding > 0 ? 'text-amber-300' : 'text-white'} />
                        <StatTile label="Average invoice" value={formatMoney(row.average_invoice, row.currency)} />
                    </div>
                    <div className="grid gap-md lg:grid-cols-2">
                        <Card title="Spend by month">
                            <BarList rows={data.spend_by_month.filter((item) => item.currency === row.currency)} labelKey="month" currency={row.currency} />
                        </Card>
                        <Card title="Cost by service">
                            <BarList rows={data.spend_by_service.filter((item) => item.currency === row.currency)} labelKey="service" currency={row.currency} />
                        </Card>
                    </div>
                    {data.cost_by_reference.some((item) => item.currency === row.currency) && (
                        <Card title="Highest costs by vehicle / reference">
                            <BarList rows={data.cost_by_reference.filter((item) => item.currency === row.currency)} labelKey="reference" currency={row.currency} />
                        </Card>
                    )}
                </div>
            ))}

            {Object.keys(data.status_breakdown).length > 0 && (
                <Card title="Vehicles by status">
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(data.status_breakdown).map(([status, count]) => (
                            <div key={status} className="rounded-lg bg-surface-container-high px-md py-2">
                                <div className="text-xl font-bold text-white">{count}</div>
                                <div className="text-xs text-on-surface-variant">{titleCase(status)}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
