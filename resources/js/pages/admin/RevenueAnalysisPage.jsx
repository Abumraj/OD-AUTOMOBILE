import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const formatters = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }),
    NGN: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }),
};

const formatMoney = (value, code) => (formatters[code] || formatters.USD).format(value || 0);

const CHART_COLORS = {
    Procurement: { revenue: '#2dd4bf', profit: '#0ea5e9' },
    Autosales: { revenue: '#f59e0b', profit: '#d97706' },
    Trucking: { revenue: '#60a5fa', profit: '#3b82f6' },
    Clearance: { revenue: '#34d399', profit: '#059669' },
};

function RevenueAnalysisPage() {
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadAnalysis = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/admin/revenue-analysis?start_date=${startDate}&end_date=${endDate}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to load revenue analysis');
            setAnalysis(data);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalysis();
    }, []);

    if (error) {
        return <div className="bg-surface-container border border-red-500/30 rounded-lg p-lg text-red-300">{error}</div>;
    }

    const sources = analysis?.sources || [];
    const revenueByCurrency = analysis?.revenue_by_currency || {};
    const profitByCurrency = analysis?.profit_by_currency || {};

    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Revenue Analysis</h1>
                <p className="font-body-lg text-on-surface-variant">Revenue and profit per service, each in the currency it's actually paid/booked in.</p>
            </div>

            <div className="bg-surface-container border border-white/10 rounded-lg p-lg flex flex-col lg:flex-row gap-md lg:items-end">
                <label className="flex-1 text-sm text-on-surface-variant">Start date
                    <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-xs w-full bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm text-white" />
                </label>
                <label className="flex-1 text-sm text-on-surface-variant">End date
                    <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-xs w-full bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm text-white" />
                </label>
                <button type="button" onClick={loadAnalysis} disabled={loading} className="bg-secondary text-on-secondary rounded-lg px-lg py-sm font-bold disabled:opacity-50">
                    {loading ? 'Loading...' : 'Apply'}
                </button>
            </div>

            {analysis && <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                    <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                        <p className="text-on-surface-variant text-sm">Total Revenue</p>
                        <p className="mt-sm text-xl font-bold text-white">{formatMoney(revenueByCurrency.USD || 0, 'USD')}</p>
                        <p className="text-xl font-bold text-white">{formatMoney(revenueByCurrency.NGN || 0, 'NGN')}</p>
                    </div>
                    <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                        <p className="text-on-surface-variant text-sm">Total Profit</p>
                        <p className="mt-sm text-xl font-bold text-white">{formatMoney(profitByCurrency.USD || 0, 'USD')}</p>
                        <p className="text-xl font-bold text-white">{formatMoney(profitByCurrency.NGN || 0, 'NGN')}</p>
                    </div>
                    <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                        <p className="text-on-surface-variant text-sm">Recorded Orders</p>
                        <p className="mt-sm text-3xl font-bold text-white">{analysis.total_orders}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
                    {sources.map((source) => {
                        const colors = CHART_COLORS[source.service] || { revenue: '#2dd4bf', profit: '#0ea5e9' };
                        const sameCurrency = source.revenue_currency === source.profit_currency;
                        const monthly = (source.monthly || []).map((entry) => ({
                            ...entry,
                            month: new Date(`${entry.month}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                        }));

                        return (
                            <div key={source.service} className="bg-surface-container border border-white/10 rounded-lg p-lg">
                                <div className="flex items-baseline justify-between mb-lg">
                                    <h2 className="font-title-lg text-white">{source.service}</h2>
                                    <span className="text-xs uppercase tracking-wide text-on-surface-variant">
                                        Revenue: {source.revenue_currency}{!sameCurrency && ` · Profit: ${source.profit_currency}`}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-md mb-lg">
                                    <div>
                                        <p className="text-on-surface-variant text-xs">Revenue</p>
                                        <p className="mt-1 text-lg font-bold text-white">{formatMoney(source.total_revenue, source.revenue_currency)}</p>
                                    </div>
                                    <div>
                                        <p className="text-on-surface-variant text-xs">Profit</p>
                                        <p className="mt-1 text-lg font-bold text-white">{formatMoney(source.total_profit, source.profit_currency)}</p>
                                    </div>
                                    <div>
                                        <p className="text-on-surface-variant text-xs">Orders</p>
                                        <p className="mt-1 text-lg font-bold text-white">{source.total_orders}</p>
                                    </div>
                                </div>

                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={monthly}>
                                        <CartesianGrid stroke="#ffffff1a" strokeDasharray="3 3" />
                                        <XAxis dataKey="month" stroke="#cbd5e1" />
                                        <YAxis stroke="#cbd5e1" tickFormatter={(value) => formatMoney(value, source.revenue_currency)} width={90} />
                                        <Tooltip formatter={(value, name) => formatMoney(value, name === 'Profit' ? source.profit_currency : source.revenue_currency)} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff33' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke={colors.revenue} strokeWidth={3} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="profit" name="Profit" stroke={colors.profit} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                                {!sameCurrency && (
                                    <p className="mt-sm text-xs text-on-surface-variant">Revenue is in {source.revenue_currency}, profit is booked in {source.profit_currency} — the two lines share an axis but not a currency.</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                    <h2 className="font-title-lg text-white mb-lg">Service Breakdown</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-white">
                            <thead className="border-b border-outline-variant text-on-surface-variant text-left">
                                <tr>
                                    <th className="px-md py-sm">Service</th>
                                    <th className="px-md py-sm">Orders</th>
                                    <th className="px-md py-sm">Revenue</th>
                                    <th className="px-md py-sm">Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sources.map((source) => (
                                    <tr key={source.service} className="border-b border-outline-variant">
                                        <td className="px-md py-sm">{source.service}</td>
                                        <td className="px-md py-sm">{source.total_orders}</td>
                                        <td className="px-md py-sm">{formatMoney(source.total_revenue, source.revenue_currency)}</td>
                                        <td className="px-md py-sm">{formatMoney(source.total_profit, source.profit_currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-lg h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sources.map((source) => ({ service: source.service, revenue: source.total_revenue, profit: source.total_profit }))}>
                                <CartesianGrid stroke="#ffffff1a" strokeDasharray="3 3" />
                                <XAxis dataKey="service" stroke="#cbd5e1" />
                                <YAxis stroke="#cbd5e1" />
                                <Tooltip formatter={(value, name, item) => {
                                    const source = sources.find((entry) => entry.service === item?.payload?.service);
                                    const code = name === 'Profit' ? source?.profit_currency : source?.revenue_currency;
                                    return formatMoney(value, code || 'USD');
                                }} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff33' }} />
                                <Legend />
                                <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="profit" name="Profit" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="mt-sm text-xs text-on-surface-variant">Bars mix currencies across services (Procurement's revenue is USD, everything else is NGN) — use this chart for order/shape comparison, not direct value comparison.</p>
                </div>
            </>}
        </div>
    );
}

export default RevenueAnalysisPage;
