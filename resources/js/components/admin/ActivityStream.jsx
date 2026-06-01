import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function ActivityStream() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const data = await api.getActivityStream();
            const formattedActivities = data.map(activity => ({
                icon: activity.icon,
                bgColor: getIconBgColor(activity.icon),
                iconColor: getIconColor(activity.icon),
                user: activity.user,
                action: activity.action,
                time: getTimeAgo(activity.time),
                location: activity.location
            }));
            setActivities(formattedActivities);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const then = new Date(date);
        const diffInMs = now - then;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        
        if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    const getIconBgColor = (icon) => {
        const colorMap = {
            'bid_landscape': 'bg-secondary-container/20',
            'file_upload': 'bg-primary-container',
            'local_shipping': 'bg-green-500/10',
            'request_quote': 'bg-blue-500/10',
            'sync': 'bg-purple-500/10'
        };
        return colorMap[icon] || 'bg-surface-container-highest';
    };

    const getIconColor = (icon) => {
        const colorMap = {
            'bid_landscape': 'text-secondary',
            'file_upload': 'text-primary',
            'local_shipping': 'text-green-400',
            'request_quote': 'text-blue-400',
            'sync': 'text-purple-400'
        };
        return colorMap[icon] || 'text-on-surface-variant';
    };

    if (loading) {
        return (
            <div className="lg:col-span-2 bg-surface-container p-md rounded-xl border border-outline-variant/30">
                <div className="flex justify-between items-center mb-md">
                    <h3 className="font-title-md text-on-surface">Recent Activity Stream</h3>
                </div>
                <div className="space-y-md">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-start space-x-md pb-md border-b border-outline-variant/20">
                            <div className="w-8 h-8 rounded-full bg-surface-container-highest animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-surface-container-highest rounded animate-pulse w-3/4"></div>
                                <div className="h-3 bg-surface-container-highest rounded animate-pulse w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="lg:col-span-2 bg-surface-container p-md rounded-xl border border-outline-variant/30">
            <div className="flex justify-between items-center mb-md">
                <h3 className="font-title-md text-on-surface">Recent Activity Stream</h3>
                <a className="text-secondary text-xs hover:underline" href="#">View All Logs</a>
            </div>
            <div className="space-y-md">
                {activities.map((activity, index) => (
                    <div
                        key={index}
                        className={`flex items-start space-x-md ${index < activities.length - 1 ? 'pb-md border-b border-outline-variant/20' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full ${activity.bgColor} flex items-center justify-center ${activity.iconColor}`}>
                            <span className="material-symbols-outlined text-sm">{activity.icon}</span>
                        </div>
                        <div>
                            <p className="text-sm text-on-surface">
                                <span className="font-bold">{activity.user}</span> {activity.action}
                            </p>
                            <p className="text-[10px] text-on-surface-variant mt-1">
                                {activity.time} • {activity.location}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ActivityStream;
