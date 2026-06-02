import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { exportToCSV } from '../../utils/csvExport';

function QuotesTable() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const handleExportCSV = () => {
        const exportData = filteredQuotes.map(quote => ({
            'Customer Name': quote.customer_name,
            'Email': quote.email,
            'Phone': quote.phone,
            'Vehicle': quote.vehicle,
            'Origin': quote.origin,
            'Destination': quote.destination,
            'Service': quote.service,
            'Status': quote.status,
            'Additional Info': quote.additional_info || '',
            'Submitted': quote.created_at
        }));
        
        const filename = `quotes_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            const data = await api.getQuotes();
            setQuotes(data);
        } catch (error) {
            console.error('Error fetching quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!confirm('Are you sure you want to approve this quote? This will create a new shipment.')) {
            return;
        }

        try {
            const result = await api.approveQuote(id);
            alert(`Quote approved! Shipment created with tracking ID: ${result.tracking_id}`);
            fetchQuotes();
        } catch (error) {
            console.error('Error approving quote:', error);
            alert('Failed to approve quote');
        }
    };

    const handleReject = async (id) => {
        if (!confirm('Are you sure you want to reject and delete this quote?')) {
            return;
        }

        try {
            await api.rejectQuote(id);
            alert('Quote rejected successfully');
            fetchQuotes();
        } catch (error) {
            console.error('Error rejecting quote:', error);
            alert('Failed to reject quote');
        }
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const then = new Date(date);
        const diffInMs = now - then;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInDays > 0) return `${diffInDays}d ago`;
        if (diffInHours > 0) return `${diffInHours}h ago`;
        if (diffInMinutes > 0) return `${diffInMinutes}m ago`;
        return 'Just now';
    };

    const filteredQuotes = quotes.filter(quote => {
        if (filter === 'all') return true;
        return quote.status === filter;
    });

    const statusBadge = (status) => {
        const colors = {
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            approved: 'bg-green-500/20 text-green-400 border-green-500/30',
            converted: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
        return colors[status] || colors.pending;
    };

    if (loading) {
        return (
            <div className="bg-surface-container p-md rounded-xl border border-outline-variant/30">
                <div className="animate-pulse space-y-md">
                    <div className="h-8 bg-surface-container-highest rounded w-1/4"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-surface-container-highest rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container p-md rounded-xl border border-outline-variant/30">
            <div className="flex justify-between items-center mb-md">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Quote Requests</h2>
                <div className="flex gap-sm">
                    <button
                        onClick={handleExportCSV}
                        className="bg-surface-container-high text-on-surface px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 border border-outline-variant"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export CSV
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            filter === 'all' 
                                ? 'bg-secondary text-on-secondary' 
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        All ({quotes.length})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            filter === 'pending' 
                                ? 'bg-secondary text-on-secondary' 
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        Pending ({quotes.filter(q => q.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            filter === 'approved' 
                                ? 'bg-secondary text-on-secondary' 
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        Approved ({quotes.filter(q => q.status === 'approved').length})
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-outline-variant/30">
                            <th className="text-left py-3 px-4 text-on-surface-variant font-medium text-sm">Customer</th>
                            <th className="text-left py-3 px-4 text-on-surface-variant font-medium text-sm">Contact</th>
                            <th className="text-left py-3 px-4 text-on-surface-variant font-medium text-sm">Vehicle</th>
                            <th className="text-left py-3 px-4 text-on-surface-variant font-medium text-sm">Route</th>
                            <th className="text-left py-3 px-4 text-on-surface-variant font-medium text-sm">Service</th>
                            <th className="text-left py-3 px-4 text-on-surface-variant font-medium text-sm">Status</th>
                            <th className="text-left py-3 px-4 text-on-surface-variant font-medium text-sm">Submitted</th>
                            <th className="text-left py-3 px-4 text-on-surface-variant font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredQuotes.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-8 text-on-surface-variant">
                                    No quotes found
                                </td>
                            </tr>
                        ) : (
                            filteredQuotes.map((quote) => (
                                <tr key={quote.id} className="border-b border-outline-variant/20 hover:bg-surface-container-high transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="font-medium text-on-surface">{quote.customer_name}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm text-on-surface-variant">{quote.email}</div>
                                        <div className="text-xs text-on-surface-variant">{quote.phone}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm text-on-surface">{quote.vehicle}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm text-on-surface-variant">
                                            <div className="flex items-center gap-1">
                                                <span>{quote.origin}</span>
                                                <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                                <span>{quote.destination}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm text-on-surface">{quote.service}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${statusBadge(quote.status)}`}>
                                            {quote.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm text-on-surface-variant">{getTimeAgo(quote.created_at)}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        {quote.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(quote.id)}
                                                    className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(quote.id)}
                                                    className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">cancel</span>
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {quote.status === 'converted' && (
                                            <span className="text-xs text-on-surface-variant">Converted to shipment</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default QuotesTable;
