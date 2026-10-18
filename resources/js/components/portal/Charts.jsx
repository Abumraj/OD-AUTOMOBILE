import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, titleCase } from './ui';

// Validated categorical palette, dark-surface steps, assigned in fixed order. A known service always
// keeps the same colour so a filter or a missing service never repaints the others.
const PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
const SERVICE_SLOTS = { Procurement: 0, Trucking: 1, Clearance: 2, Autosales: 3, Autosale: 3, Shipping: 4 };
const SURFACE = '#1e2020';
const GRID = 'rgba(255,255,255,0.08)';
const INK = '#c7c5d3';

const compact = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

function monthLabel(value) {
    const [year, month] = String(value).split('-');
    if (!year || !month) return value;
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function MoneyTooltip({ active, payload, label, currency, labelFormatter }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-white/10 bg-surface-container-highest p-3 text-sm shadow-xl">
            <div className="mb-1 font-semibold text-white">{labelFormatter ? labelFormatter(label) : label}</div>
            {payload.map((item) => (
                <div key={item.dataKey} className="flex items-center justify-between gap-6 text-on-surface-variant">
                    <span className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.payload?.fill || item.color }} />
                        {item.name}
                    </span>
                    <span className="text-white">{currency ? formatMoney(item.value, currency) : item.value}</span>
                </div>
            ))}
        </div>
    );
}

function ChartFrame({ label, children, height }) {
    return (
        <div role="img" aria-label={label}>
            <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
        </div>
    );
}

/** Column chart of one currency's spend over time. */
export function SpendByMonthChart({ rows, currency }) {
    if (rows.length === 0) return null;
    const total = rows.reduce((sum, row) => sum + row.amount, 0);

    return (
        <ChartFrame label={`Column chart of monthly spend in ${currency}, ${rows.length} months, ${formatMoney(total, currency)} in total.`} height={260}>
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="month" tickFormatter={monthLabel} stroke={INK} tick={{ fill: INK, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={compact} width={48} stroke={INK} tick={{ fill: INK, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<MoneyTooltip currency={currency} labelFormatter={monthLabel} />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="amount" name="Spend" fill={PALETTE[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
        </ChartFrame>
    );
}

/** Part-to-whole of spend by service. Colours follow the service, not its rank. */
export function ServiceShareChart({ rows, currency }) {
    if (rows.length === 0) return null;

    let spare = Object.keys(SERVICE_SLOTS).length;
    const data = rows.map((row) => {
        const slot = SERVICE_SLOTS[row.service] ?? spare++;
        return { name: row.service, value: row.amount, fill: PALETTE[slot % PALETTE.length] };
    });
    const total = data.reduce((sum, row) => sum + row.value, 0);

    return (
        <div>
            <ChartFrame label={`Donut chart of spend by service in ${currency}. ${data.map((row) => `${row.name} ${Math.round((row.value / total) * 100)} percent`).join(', ')}.`} height={220}>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} stroke={SURFACE} strokeWidth={2}>
                        {data.map((row) => <Cell key={row.name} fill={row.fill} />)}
                    </Pie>
                    <Tooltip content={<MoneyTooltip currency={currency} />} />
                </PieChart>
            </ChartFrame>
            <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {data.map((row) => (
                    <li key={row.name} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-on-surface"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: row.fill }} />{row.name}</span>
                        <span className="text-on-surface-variant">{formatMoney(row.value, currency)} · {Math.round((row.value / total) * 100)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Horizontal bars for a ranked list (highest costs by vehicle). */
export function RankedBarChart({ rows, labelKey, currency }) {
    if (rows.length === 0) return null;
    const data = rows.map((row) => ({ name: String(row[labelKey]), amount: row.amount }));

    return (
        <ChartFrame label={`Bar chart of the ${data.length} highest costs in ${currency}.`} height={Math.max(180, data.length * 38 + 30)}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 4 }}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tickFormatter={compact} stroke={INK} tick={{ fill: INK, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={118} tickFormatter={(value) => (value.length > 16 ? `${value.slice(0, 15)}…` : value)} stroke={INK} tick={{ fill: '#e2e2e2', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<MoneyTooltip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="amount" name="Cost" fill={PALETTE[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
        </ChartFrame>
    );
}

/** Counts of vehicles by status. */
export function StatusChart({ breakdown }) {
    const data = Object.entries(breakdown).map(([status, count]) => ({ name: titleCase(status), count }));
    if (data.length === 0) return null;

    return (
        <ChartFrame label={`Bar chart of vehicles by status. ${data.map((row) => `${row.name} ${row.count}`).join(', ')}.`} height={240}>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="name" stroke={INK} tick={{ fill: INK, fontSize: 12 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} width={32} stroke={INK} tick={{ fill: INK, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<MoneyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" name="Vehicles" fill={PALETTE[0]} radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
        </ChartFrame>
    );
}
