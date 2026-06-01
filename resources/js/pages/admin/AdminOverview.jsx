import React from 'react';
import DashboardStats from '../../components/admin/DashboardStats';
import ActivityStream from '../../components/admin/ActivityStream';
import FleetHealth from '../../components/admin/FleetHealth';
import { Link } from 'react-router-dom';

function AdminOverview() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Dashboard Overview</h1>
                <p className="font-body-lg text-on-surface-variant">Welcome back! Here's what's happening today.</p>
            </div>

            <DashboardStats />

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-md">
                <Link to="/admin/shipments" className="bg-surface-container rounded-xl p-lg border border-white/10 hover:border-secondary-container transition-all group">
                    <div className="flex items-center gap-md mb-md">
                        <div className="w-12 h-12 bg-secondary-container/20 rounded-lg flex items-center justify-center group-hover:bg-secondary-container/30 transition-all">
                            <span className="material-symbols-outlined text-secondary-container">local_shipping</span>
                        </div>
                        <div>
                            <h3 className="font-title-lg text-white">Shipments</h3>
                            <p className="font-caption text-on-surface-variant">Manage tracking</p>
                        </div>
                    </div>
                    <p className="font-body-sm text-on-surface-variant">Track and manage all shipments with real-time updates</p>
                </Link>

                <Link to="/admin/quotes" className="bg-surface-container rounded-xl p-lg border border-white/10 hover:border-secondary-container transition-all group">
                    <div className="flex items-center gap-md mb-md">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-all">
                            <span className="material-symbols-outlined text-blue-400">request_quote</span>
                        </div>
                        <div>
                            <h3 className="font-title-lg text-white">Quotes</h3>
                            <p className="font-caption text-on-surface-variant">Review requests</p>
                        </div>
                    </div>
                    <p className="font-body-sm text-on-surface-variant">View and respond to customer quote requests</p>
                </Link>

                <Link to="/admin/auctions" className="bg-surface-container rounded-xl p-lg border border-white/10 hover:border-secondary-container transition-all group">
                    <div className="flex items-center gap-md mb-md">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-all">
                            <span className="material-symbols-outlined text-orange-400">gavel</span>
                        </div>
                        <div>
                            <h3 className="font-title-lg text-white">Auctions</h3>
                            <p className="font-caption text-on-surface-variant">Manage bidding</p>
                        </div>
                    </div>
                    <p className="font-body-sm text-on-surface-variant">Track auctions and handle customer requests</p>
                </Link>

                <Link to="/admin/testimonials" className="bg-surface-container rounded-xl p-lg border border-white/10 hover:border-secondary-container transition-all group">
                    <div className="flex items-center gap-md mb-md">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                            <span className="material-symbols-outlined text-purple-400">star</span>
                        </div>
                        <div>
                            <h3 className="font-title-lg text-white">Testimonials</h3>
                            <p className="font-caption text-on-surface-variant">Manage reviews</p>
                        </div>
                    </div>
                    <p className="font-body-sm text-on-surface-variant">Approve and feature customer testimonials</p>
                </Link>

                <Link to="/admin/messages" className="bg-surface-container rounded-xl p-lg border border-white/10 hover:border-secondary-container transition-all group">
                    <div className="flex items-center gap-md mb-md">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-all">
                            <span className="material-symbols-outlined text-green-400">mail</span>
                        </div>
                        <div>
                            <h3 className="font-title-lg text-white">Messages</h3>
                            <p className="font-caption text-on-surface-variant">Contact inquiries</p>
                        </div>
                    </div>
                    <p className="font-body-sm text-on-surface-variant">Respond to customer contact messages</p>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
                <div className="lg:col-span-2">
                    <ActivityStream />
                </div>
                <FleetHealth />
            </div>
        </div>
    );
}

export default AdminOverview;
