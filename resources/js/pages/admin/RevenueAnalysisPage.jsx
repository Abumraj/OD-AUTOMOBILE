import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

const colors = ['#2dd4bf', '#f59e0b', '#60a5fa', '#34d399', '#f472b6'];

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

    const breakdown = analysis?.breakdown || [];
    const monthlyRevenue = (analysis?.monthly_revenue || []).map((entry) => ({
        ...entry,
        month: new Date(`${entry.month}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    }));

    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Revenue Analysis</h1>
                <p className="font-body-lg text-on-surface-variant">Realized revenue across operational services.</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                        <p className="text-on-surface-variant text-sm">Total Revenue</p>
                        <p className="mt-sm text-3xl font-bold text-white">{currency.format(analysis.total_revenue)}</p>
                    </div>
                    <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                        <p className="text-on-surface-variant text-sm">Recorded Orders</p>
                        <p className="mt-sm text-3xl font-bold text-white">{analysis.total_orders}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
                    <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                        <h2 className="font-title-lg text-white mb-lg">Revenue Over Time</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyRevenue}>
                                <CartesianGrid stroke="#ffffff1a" strokeDasharray="3 3" />
                                <XAxis dataKey="month" stroke="#cbd5e1" />
                                <YAxis stroke="#cbd5e1" tickFormatter={(value) => `$${value}`} />
                                <Tooltip formatter={(value) => currency.format(value)} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff33' }} />
                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                        <h2 className="font-title-lg text-white mb-lg">Revenue By Service</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={breakdown} dataKey="revenue" nameKey="service" innerRadius={65} outerRadius={105} paddingAngle={3}>
                                    {breakdown.map((entry, index) => <Cell key={entry.service} fill={colors[index % colors.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => currency.format(value)} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff33' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                    <h2 className="font-title-lg text-white mb-lg">Service Breakdown</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-white">
                            <thead className="border-b border-outline-variant text-on-surface-variant text-left"><tr><th className="px-md py-sm">Service</th><th className="px-md py-sm">Orders</th><th className="px-md py-sm">Revenue</th></tr></thead>
                            <tbody>{breakdown.map((entry) => <tr key={entry.service} className="border-b border-outline-variant"><td className="px-md py-sm">{entry.service}</td><td className="px-md py-sm">{entry.orders}</td><td className="px-md py-sm">{currency.format(entry.revenue)}</td></tr>)}</tbody>
                        </table>
                    </div>
                    <div className="mt-lg h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={breakdown}>
                                <CartesianGrid stroke="#ffffff1a" strokeDasharray="3 3" />
                                <XAxis dataKey="service" stroke="#cbd5e1" />
                                <YAxis stroke="#cbd5e1" tickFormatter={(value) => `$${value}`} />
                                <Tooltip formatter={(value) => currency.format(value)} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #ffffff33' }} />
                                <Bar dataKey="revenue" name="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </>}
        </div>
    );
}

export default RevenueAnalysisPage;
