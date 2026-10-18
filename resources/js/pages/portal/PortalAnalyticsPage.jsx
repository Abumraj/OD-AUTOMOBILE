import React from 'react';
import portalApi from '../../services/portalApi';
import { RankedBarChart, ServiceShareChart, SpendByMonthChart, StatusChart } from '../../components/portal/Charts';
import { Card, Empty, Notice, PageHeader, Spinner, StatTile, formatMoney, titleCase, useLoad } from '../../components/portal/ui';

function BarList({ rows, labelKey, currency }) {
    const max = Math.max(...rows.map((row) => row.amount), 1);
    return (
        <ul className="space-y-3">
            {rows.map((row, index) => (
                <li key={`${row[labelKey]}-${index}`}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="truncate text-on-surface">{row[labelKey]}</span>
                        <span className="shrink-0 text-white">{formatMoney(row.amount, currency)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${(row.amount / max) * 100}%` }} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

/** A chart with the plain figures beside it, so the numbers stay readable next to the picture. */
function ChartAndList({ title, chart, list }) {
    return (
        <Card title={title}>
            <div className="grid gap-md lg:grid-cols-2">
                <div className="min-w-0">{chart}</div>
                <div className="min-w-0 lg:border-l lg:border-white/10 lg:pl-md">{list}</div>
            </div>
        </Card>
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

            {data.by_currency.length === 0 ? <Empty>Spending figures appear once invoices are issued.</Empty> : data.by_currency.map((row) => {
                const months = data.spend_by_month.filter((item) => item.currency === row.currency);
                const services = data.spend_by_service.filter((item) => item.currency === row.currency);
                const references = data.cost_by_reference.filter((item) => item.currency === row.currency);

                return (
                    <div key={row.currency} className="space-y-md">
                        <h2 className="text-lg font-semibold text-white">{row.currency}</h2>
                        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
                            <StatTile label="Invoiced" value={formatMoney(row.invoiced, row.currency)} />
                            <StatTile label="Paid" value={formatMoney(row.paid, row.currency)} tone="text-green-400" />
                            <StatTile label="Outstanding" value={formatMoney(row.outstanding, row.currency)} tone={row.outstanding > 0 ? 'text-amber-300' : 'text-white'} />
                            <StatTile label="Average invoice" value={formatMoney(row.average_invoice, row.currency)} />
                        </div>

                        <ChartAndList
                            title="Spend by month"
                            chart={<SpendByMonthChart rows={months} currency={row.currency} />}
                            list={<BarList rows={months} labelKey="month" currency={row.currency} />}
                        />
                        <ChartAndList
                            title="Cost by service"
                            chart={<ServiceShareChart rows={services} currency={row.currency} />}
                            list={<BarList rows={services} labelKey="service" currency={row.currency} />}
                        />
                        {references.length > 0 && (
                            <ChartAndList
                                title="Highest costs by vehicle"
                                chart={<RankedBarChart rows={references} labelKey="reference" currency={row.currency} />}
                                list={<BarList rows={references} labelKey="reference" currency={row.currency} />}
                            />
                        )}
                    </div>
                );
            })}

            {Object.keys(data.status_breakdown).length > 0 && (
                <ChartAndList
                    title="Vehicles by status"
                    chart={<StatusChart breakdown={data.status_breakdown} />}
                    list={(
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(data.status_breakdown).map(([status, count]) => (
                                <div key={status} className="rounded-lg bg-surface-container-high px-md py-2">
                                    <div className="text-xl font-bold text-white">{count}</div>
                                    <div className="text-xs text-on-surface-variant">{titleCase(status)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                />
            )}
        </div>
    );
}
