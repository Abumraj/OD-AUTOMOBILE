import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DashboardAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/admin/analytics');
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-surface-container rounded-xl p-lg border border-white/10 h-80 animate-pulse">
                        <div className="h-6 bg-white/10 rounded w-1/3 mb-md"></div>
                        <div className="h-full bg-white/5 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!analytics) {
        return null;
    }

    // Transform data for charts
    const shipmentsData = analytics.shipments_over_time.map(item => ({
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        shipments: parseInt(item.count)
    }));

    const statusData = analytics.status_distribution.map(item => ({
        name: item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: parseInt(item.count)
    }));

    const revenueData = analytics.monthly_revenue.map(item => ({
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: parseFloat(item.revenue || 0)
    }));

    const destinationsData = analytics.top_destinations.map(item => ({
        country: item.destination_country,
        shipments: parseInt(item.count)
    }));

    // Process quotes vs shipments data
    const quotesVsShipmentsData = analytics.quotes_vs_shipments.reduce((acc, item) => {
        const month = new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const existing = acc.find(d => d.month === month);
        if (existing) {
            existing[item.type] = parseInt(item.count);
        } else {
            acc.push({
                month,
                [item.type]: parseInt(item.count)
            });
        }
        return acc;
    }, []);

    const COLORS = ['#667eea', '#48bb78', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface-container-high p-md rounded-lg border border-white/20 shadow-xl">
                    <p className="font-label-md text-white mb-xs">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="font-body-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-md">
            <div className="flex items-center justify-between mb-md">
                <h2 className="font-headline-sm text-headline-sm text-white">Analytics Dashboard</h2>
                <button 
                    onClick={fetchAnalytics}
                    className="flex items-center gap-sm bg-surface-container hover:bg-surface-container-high text-white px-md py-sm rounded-lg transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">refresh</span>
                    <span className="font-label-md">Refresh</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
                {/* Shipments Over Time */}
                <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                    <h3 className="font-title-lg text-white mb-md flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary-container">trending_up</span>
                        Shipments Trend (6 Months)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={shipmentsData}>
                            <defs>
                                <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="month" stroke="#ffffff80" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#ffffff80" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="shipments" stroke="#667eea" fillOpacity={1} fill="url(#colorShipments)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Distribution */}
                <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                    <h3 className="font-title-lg text-white mb-md flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary-container">donut_small</span>
                        Shipment Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue Trend */}
                <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                    <h3 className="font-title-lg text-white mb-md flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary-container">payments</span>
                        Revenue Trend (6 Months)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="month" stroke="#ffffff80" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#ffffff80" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#ffffff' }} />
                            <Line type="monotone" dataKey="revenue" stroke="#48bb78" strokeWidth={2} dot={{ fill: '#48bb78', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Destinations */}
                <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                    <h3 className="font-title-lg text-white mb-md flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary-container">public</span>
                        Top 5 Destinations
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={destinationsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="country" stroke="#ffffff80" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#ffffff80" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="shipments" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Quotes vs Shipments */}
                <div className="bg-surface-container rounded-xl p-lg border border-white/10 lg:col-span-2">
                    <h3 className="font-title-lg text-white mb-md flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary-container">compare_arrows</span>
                        Quotes vs Shipments Comparison
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={quotesVsShipmentsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                            <XAxis dataKey="month" stroke="#ffffff80" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#ffffff80" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#ffffff' }} />
                            <Line type="monotone" dataKey="quotes" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                            <Line type="monotone" dataKey="shipments" stroke="#667eea" strokeWidth={2} dot={{ fill: '#667eea', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default DashboardAnalytics;
