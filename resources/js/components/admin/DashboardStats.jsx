import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function DashboardStats() {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await api.getStats();
            setStatsData(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-md">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-primary-container p-md rounded-xl border border-outline-variant/30 animate-pulse h-32"></div>
                ))}
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Quotes',
            icon: 'request_quote',
            value: statsData?.total_quotes?.toLocaleString() || '0',
            trend: {
                label: `${statsData?.quotes_growth >= 0 ? '+' : ''}${statsData?.quotes_growth}% this month`,
                icon: statsData?.quotes_growth >= 0 ? 'trending_up' : 'trending_down',
                color: statsData?.quotes_growth >= 0 ? 'text-green-400' : 'text-red-400'
            },
            bgIcon: 'analytics'
        },
        {
            label: 'Active Shipments',
            icon: 'local_shipping',
            value: statsData?.active_shipments?.toLocaleString() || '0',
            trend: { label: 'In-transit worldwide', icon: 'schedule', color: 'text-on-surface-variant' },
            bgIcon: 'public'
        },
        {
            label: 'Procurement',
            icon: 'inventory_2',
            value: statsData?.procurement_count?.toLocaleString() || '0',
            trend: { label: 'Live sourcing jobs', icon: 'gavel', color: 'text-blue-400' },
            bgIcon: 'shopping_cart'
        },
        {
            label: 'Trucking',
            icon: 'local_shipping',
            value: statsData?.trucking_count?.toLocaleString() || '0',
            trend: { label: 'Port-to-door routing', icon: 'route', color: 'text-orange-400' },
            bgIcon: 'directions_car'
        },
        {
            label: 'Auto Sales',
            icon: 'sell',
            value: statsData?.auto_sales_count?.toLocaleString() || '0',
            trend: { label: 'Revenue opportunities', icon: 'payments', color: 'text-purple-400' },
            bgIcon: 'attach_money'
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-md">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-primary-container p-md rounded-xl border border-outline-variant/30 relative overflow-hidden group"
                >
                    <div className="flex justify-between items-start mb-base relative z-10">
                        <p className="font-label-md text-on-surface-variant">{stat.label}</p>
                        <span className="material-symbols-outlined text-secondary">{stat.icon}</span>
                    </div>
                    <p className="font-display-lg text-secondary text-2xl md:text-3xl mb-1 relative z-10 break-words">{stat.value}</p>
                    <div className={`flex items-center text-xs ${stat.trend.color} font-medium relative z-10`}>
                        <span className="material-symbols-outlined text-sm mr-1">{stat.trend.icon}</span>
                        <span>{stat.trend.label}</span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-9xl">{stat.bgIcon}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default DashboardStats;
