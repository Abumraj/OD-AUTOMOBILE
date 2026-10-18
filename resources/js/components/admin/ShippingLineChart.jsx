import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Categorical slots 1-3 of the validated palette (dark-surface steps), always in this order.
const SERIES = [
    { key: 'shipments', label: 'Shipments', color: '#3987e5' },
    { key: 'truckings', label: 'Trucking', color: '#d95926' },
    { key: 'clearances', label: 'Clearance', color: '#199e70' },
];

const SURFACE = '#1e2020';
const GRID = 'rgba(255,255,255,0.08)';
const INK_SECONDARY = '#c7c5d3';

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

    return (
        <div className="rounded-lg border border-white/10 bg-surface-container-highest p-3 text-sm shadow-xl">
            <div className="mb-1 font-semibold text-white">{label}</div>
            {payload.map((item) => (
                <div key={item.dataKey} className="flex items-center justify-between gap-6 text-on-surface-variant">
                    <span className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                        {item.name}
                    </span>
                    <span className="text-white">{item.value}</span>
                </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-white/10 pt-1 text-on-surface-variant">
                <span>Total</span><span className="font-semibold text-white">{total}</span>
            </div>
        </div>
    );
}

/**
 * Which shipping line is used most. Lines are ranked by total use across shipments, trucking and
 * clearance. Records with no line recorded are reported beside the chart, not ranked in it.
 */
export default function ShippingLineChart({ lines = [] }) {
    const [view, setView] = useState('chart');

    const ranked = lines.filter((line) => line.name !== 'Not specified');
    const unspecified = lines.find((line) => line.name === 'Not specified');
    const recordedTotal = ranked.reduce((sum, line) => sum + line.total, 0);
    const top = ranked[0];

    if (ranked.length === 0) {
        return <p className="py-lg text-center text-on-surface-variant">No shipping line has been recorded on any shipment yet.</p>;
    }

    const share = recordedTotal ? Math.round((top.total / recordedTotal) * 100) : 0;
    const height = Math.max(220, ranked.length * 52 + 70);

    return (
        <div>
            <div className="mb-md flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="text-xs uppercase tracking-wide text-on-surface-variant">Most used shipping line</div>
                    <div className="text-2xl font-bold text-white">{top.name}</div>
                    <div className="text-sm text-on-surface-variant">{top.total} of {recordedTotal} records ({share}%)</div>
                </div>
                <div className="inline-flex overflow-hidden rounded-lg border border-outline-variant text-sm" role="group" aria-label="Chart or table">
                    {[['chart', 'Chart'], ['table', 'Table']].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setView(value)}
                            aria-pressed={view === value}
                            className={`px-md py-1.5 ${view === value ? 'bg-secondary text-on-secondary' : 'text-on-surface hover:bg-surface-container-high'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {view === 'chart' ? (
                <div role="img" aria-label={`Bar chart of shipping line usage. ${top.name} is used most with ${top.total} records.`}>
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={ranked} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barCategoryGap="28%">
                            <CartesianGrid horizontal={false} stroke={GRID} />
                            <XAxis type="number" allowDecimals={false} stroke={INK_SECONDARY} tick={{ fill: INK_SECONDARY, fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" width={96} stroke={INK_SECONDARY} tick={{ fill: '#e2e2e2', fontSize: 13 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            <Legend verticalAlign="top" align="left" iconType="square" iconSize={10} wrapperStyle={{ paddingBottom: 8, color: INK_SECONDARY, fontSize: 12 }} />
                            {SERIES.map((series, index) => (
                                <Bar
                                    key={series.key}
                                    dataKey={series.key}
                                    name={series.label}
                                    stackId="usage"
                                    fill={series.color}
                                    stroke={SURFACE}
                                    strokeWidth={2}
                                    radius={index === SERIES.length - 1 ? [0, 4, 4, 0] : 0}
                                    maxBarSize={26}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase text-on-surface-variant">
                            <tr><th className="py-2 pr-3">Shipping line</th>{SERIES.map((series) => <th key={series.key} className="pr-3 text-right">{series.label}</th>)}<th className="text-right">Total</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-white">
                            {lines.map((line) => (
                                <tr key={line.name} className={line.name === 'Not specified' ? 'text-on-surface-variant' : ''}>
                                    <td className="py-2 pr-3">{line.name}</td>
                                    {SERIES.map((series) => <td key={series.key} className="pr-3 text-right">{line[series.key]}</td>)}
                                    <td className="text-right font-semibold">{line.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {unspecified && (
                <p className="mt-md text-xs text-on-surface-variant">
                    {unspecified.total} record(s) have no shipping line recorded ({unspecified.shipments} shipments, {unspecified.truckings} trucking, {unspecified.clearances} clearance) and are left out of the ranking.
                </p>
            )}
        </div>
    );
}
