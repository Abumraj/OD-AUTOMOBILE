import React, { useState, useEffect } from 'react';
import api from '../../services/api';

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
                {[1, 2, 3, 4].map(i => (
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
            label: 'Pending Clearance',
            icon: 'assignment_turned_in',
            value: statsData?.pending_clearance?.toLocaleString() || '0',
            trend: { 
                label: `${statsData?.critical_delays || 0} Critical delay items`, 
                icon: 'priority_high', 
                color: 'text-red-400' 
            },
            bgIcon: 'description'
        },
        {
            label: 'Delivered (YTD)',
            icon: 'inventory_2',
            value: statsData?.delivered_ytd?.toLocaleString() || '0',
            trend: { 
                label: `${statsData?.success_rate || 0}% success rate`, 
                icon: 'check_circle', 
                color: 'text-green-400' 
            },
            bgIcon: 'flag'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-primary-container p-md rounded-xl border border-outline-variant/30 relative overflow-hidden group"
                >
                    <div className="flex justify-between items-start mb-base relative z-10">
                        <p className="font-label-md text-on-surface-variant">{stat.label}</p>
                        <span className="material-symbols-outlined text-secondary">{stat.icon}</span>
                    </div>
                    <p className="font-display-lg text-secondary text-4xl mb-1 relative z-10">{stat.value}</p>
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
