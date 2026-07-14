import React from 'react';
import DashboardAnalytics from '../../components/admin/DashboardAnalytics';

function AdminAnalyticsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Analytics & Insights</h1>
                <p className="font-body-lg text-on-surface-variant">Comprehensive analytics and business intelligence dashboard.</p>
            </div>

            <DashboardAnalytics />
        </div>
    );
}

export default AdminAnalyticsPage;
