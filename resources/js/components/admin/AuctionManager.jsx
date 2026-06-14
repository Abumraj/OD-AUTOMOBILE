import React, { useState, useEffect } from 'react';
import { exportToCSV } from '../../utils/csvExport';

function AuctionManager() {
    const [auctions, setAuctions] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAuction, setEditingAuction] = useState(null);
    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('auctions');
    const [filter, setFilter] = useState('all');

    const handleExportAuctions = () => {
        const exportData = filteredAuctions.map(auction => ({
            'Auction Number': auction.auction_number,
            'Vehicle': auction.vehicle,
            'VIN': auction.vehicle_vin || '',
            'Platform': auction.auction_platform,
            'Location': auction.auction_location,
            'Current Bid': auction.current_bid || '',
            'Reserve Price': auction.reserve_price || '',
            'Status': auction.status,
            'Customer': auction.customer_name || '',
            'Customer Email': auction.customer_email || '',
            'Start Time': auction.auction_start_time || '',
            'End Time': auction.auction_end_time || '',
            'Created': auction.created_at
        }));
        
        const filename = `auctions_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
        showNotification('Auctions exported successfully', 'success');
    };

    const handleExportRequests = () => {
        const exportData = requests.map(request => ({
            'Customer Name': request.customer_name,
            'Email': request.customer_email,
            'Phone': request.customer_phone || '',
            'Vehicle': `${request.vehicle_year} ${request.vehicle_make} ${request.vehicle_model}`,
            'Max Budget': request.max_budget,
            'Status': request.status,
            'Additional Requirements': request.additional_requirements || '',
            'Submitted': request.created_at
        }));
        
        const filename = `auction_requests_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
        showNotification('Requests exported successfully', 'success');
    };

    const [formData, setFormData] = useState({
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: '',
        vehicle_vin: '',
        vehicle_color: '',
        vehicle_type: '',
        vehicle_mileage: '',
        vehicle_description: '',
        auction_platform: '',
        auction_location: '',
        lot_number: '',
        title_status: 'clean',
        damage_description: '',
        current_bid: '',
        reserve_price: '',
        buy_now_price: '',
        estimated_repair_cost: '',
        market_value: '',
        status: 'upcoming',
        auction_start_time: '',
        auction_end_time: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_max_bid: '',
        deposit_paid: false,
        deposit_amount: '',
        admin_notes: '',
        featured: false
    });

    useEffect(() => {
        fetchAuctions();
        fetchRequests();
    }, []);

    const fetchAuctions = async () => {
        try {
            const response = await fetch('/api/admin/auctions');
            const data = await response.json();
            setAuctions(data);
        } catch (error) {
            console.error('Error fetching auctions:', error);
            showNotification('Failed to load auctions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            const response = await fetch('/api/admin/auction-requests');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingAuction 
                ? `/api/admin/auctions/${editingAuction.id}`
                : '/api/admin/auctions';
            
            const method = editingAuction ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(
                    editingAuction ? 'Auction updated successfully' : 'Auction created successfully',
                    'success'
                );
                setShowModal(false);
                resetForm();
                fetchAuctions();
            } else {
                showNotification(data.message || 'Failed to save auction', 'error');
            }
        } catch (error) {
            console.error('Error saving auction:', error);
            showNotification('Failed to save auction', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this auction?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/auctions/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Auction deleted successfully', 'success');
                fetchAuctions();
            } else {
                showNotification('Failed to delete auction', 'error');
            }
        } catch (error) {
            console.error('Error deleting auction:', error);
            showNotification('Failed to delete auction', 'error');
        }
    };

    const handleRequestStatusChange = async (requestId, newStatus) => {
        try {
            const response = await fetch(`/api/admin/auction-requests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                showNotification('Request status updated successfully', 'success');
                fetchRequests();
            } else {
                showNotification('Failed to update request status', 'error');
            }
        } catch (error) {
            console.error('Error updating request status:', error);
            showNotification('Failed to update request status', 'error');
        }
    };

    const openEditModal = async (auction) => {
        try {
            const response = await fetch(`/api/admin/auctions/${auction.id}`);
            const data = await response.json();
            
            setEditingAuction(data.auction);
            setFormData({
                vehicle_make: data.auction.vehicle_make || '',
                vehicle_model: data.auction.vehicle_model || '',
                vehicle_year: data.auction.vehicle_year || '',
                vehicle_vin: data.auction.vehicle_vin || '',
                vehicle_color: data.auction.vehicle_color || '',
                vehicle_type: data.auction.vehicle_type || '',
                vehicle_mileage: data.auction.vehicle_mileage || '',
                vehicle_description: data.auction.vehicle_description || '',
                auction_platform: data.auction.auction_platform || '',
                auction_location: data.auction.auction_location || '',
                lot_number: data.auction.lot_number || '',
                title_status: data.auction.title_status || 'clean',
                damage_description: data.auction.damage_description || '',
                current_bid: data.auction.current_bid || '',
                reserve_price: data.auction.reserve_price || '',
                buy_now_price: data.auction.buy_now_price || '',
                estimated_repair_cost: data.auction.estimated_repair_cost || '',
                market_value: data.auction.market_value || '',
                status: data.auction.status || 'upcoming',
                auction_start_time: data.auction.auction_start_time ? data.auction.auction_start_time.substring(0, 16) : '',
                auction_end_time: data.auction.auction_end_time ? data.auction.auction_end_time.substring(0, 16) : '',
                customer_name: data.auction.customer_name || '',
                customer_email: data.auction.customer_email || '',
                customer_phone: data.auction.customer_phone || '',
                customer_max_bid: data.auction.customer_max_bid || '',
                deposit_paid: data.auction.deposit_paid || false,
                deposit_amount: data.auction.deposit_amount || '',
                admin_notes: data.auction.admin_notes || '',
                featured: data.auction.featured || false
            });
            setShowModal(true);
        } catch (error) {
            console.error('Error loading auction:', error);
            showNotification('Failed to load auction details', 'error');
        }
    };

    const resetForm = () => {
        setEditingAuction(null);
        setFormData({
            vehicle_make: '',
            vehicle_model: '',
            vehicle_year: '',
            vehicle_vin: '',
            vehicle_color: '',
            vehicle_type: '',
            vehicle_mileage: '',
            vehicle_description: '',
            auction_platform: '',
            auction_location: '',
            lot_number: '',
            title_status: 'clean',
            damage_description: '',
            current_bid: '',
            reserve_price: '',
            buy_now_price: '',
            estimated_repair_cost: '',
            market_value: '',
            status: 'upcoming',
            auction_start_time: '',
            auction_end_time: '',
            customer_name: '',
            customer_email: '',
            customer_phone: '',
            customer_max_bid: '',
            deposit_paid: false,
            deposit_amount: '',
            admin_notes: '',
            featured: false
        });
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-gray-500/20 text-gray-400',
            searching: 'bg-blue-500/20 text-blue-400',
            found: 'bg-cyan-500/20 text-cyan-400',
            bidding: 'bg-yellow-500/20 text-yellow-400',
            upcoming: 'bg-blue-500/20 text-blue-400',
            live: 'bg-green-500/20 text-green-400',
            won: 'bg-purple-500/20 text-purple-400',
            lost: 'bg-red-500/20 text-red-400',
            pending_payment: 'bg-yellow-500/20 text-yellow-400',
            completed: 'bg-green-500/20 text-green-400',
            cancelled: 'bg-gray-500/20 text-gray-400'
        };
        return colors[status] || colors.pending;
    };

    const filteredAuctions = filter === 'all' 
        ? auctions 
        : auctions.filter(a => a.status === filter);

    if (loading) {
        return (
            <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                <div className="animate-pulse space-y-md">
                    <div className="h-6 bg-primary-container rounded w-1/3"></div>
                    <div className="h-4 bg-primary-container rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container rounded-xl p-lg border border-white/10">
            {notification && (
                <div className={`mb-md p-md rounded-lg ${notification.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {notification.message}
                </div>
            )}

            <div className="flex items-center justify-between mb-lg">
                <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
                        Auction Management
                    </h2>
                    <p className="font-body-md text-on-surface-variant">
                        Manage vehicle auctions and customer requests
                    </p>
                </div>
                <div className="flex gap-sm">
                    <button
                        onClick={activeTab === 'auctions' ? handleExportAuctions : handleExportRequests}
                        className="bg-surface-container-high text-on-surface px-md py-sm rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-sm border border-outline-variant"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export CSV
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-sm"
                    >
                        <span className="material-symbols-outlined">add</span>
                        New Auction
                    </button>
                </div>
            </div>

            <div className="flex gap-sm mb-md border-b border-white/10">
                <button
                    onClick={() => setActiveTab('auctions')}
                    className={`px-md py-sm font-label-md transition-all ${
                        activeTab === 'auctions' 
                            ? 'text-secondary-container border-b-2 border-secondary-container' 
                            : 'text-on-surface-variant hover:text-white'
                    }`}
                >
                    Auctions ({auctions.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-md py-sm font-label-md transition-all ${
                        activeTab === 'requests' 
                            ? 'text-secondary-container border-b-2 border-secondary-container' 
                            : 'text-on-surface-variant hover:text-white'
                    }`}
                >
                    Customer Requests ({requests.length})
                </button>
            </div>

            {activeTab === 'auctions' && (
                <>
                    <div className="flex gap-sm mb-md overflow-x-auto">
                        {['all', 'upcoming', 'live', 'won', 'completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-md py-xs rounded-lg font-label-md whitespace-nowrap transition-all ${
                                    filter === status 
                                        ? 'bg-secondary-container text-on-secondary-container' 
                                        : 'bg-primary-container text-on-surface-variant hover:bg-surface-container'
                                }`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Auction #</th>
                                    <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Vehicle</th>
                                    <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Platform</th>
                                    <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Current Bid</th>
                                    <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Status</th>
                                    <th className="text-left py-sm px-md font-label-md text-on-surface-variant">End Time</th>
                                    <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Customer</th>
                                    <th className="text-right py-sm px-md font-label-md text-on-surface-variant">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAuctions.map(auction => (
                                    <tr key={auction.id} className="border-b border-white/5 hover:bg-primary-container/50 transition-colors">
                                        <td className="py-md px-md font-label-md text-white">{auction.auction_number}</td>
                                        <td className="py-md px-md">
                                            <div className="font-body-md text-white">{auction.vehicle}</div>
                                            <div className="font-caption text-on-surface-variant">{auction.vehicle_vin || 'No VIN'}</div>
                                        </td>
                                        <td className="py-md px-md">
                                            <div className="font-body-md text-white">{auction.auction_platform}</div>
                                            <div className="font-caption text-on-surface-variant">{auction.auction_location}</div>
                                        </td>
                                        <td className="py-md px-md font-body-md text-secondary-container">
                                            ${parseFloat(auction.current_bid || 0).toLocaleString()}
                                        </td>
                                        <td className="py-md px-md">
                                            <span className={`px-sm py-xs rounded-full font-caption ${getStatusColor(auction.status)}`}>
                                                {auction.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                        </td>
                                        <td className="py-md px-md font-caption text-on-surface-variant">
                                            {auction.auction_end_time ? new Date(auction.auction_end_time).toLocaleString() : 'TBD'}
                                        </td>
                                        <td className="py-md px-md font-caption text-on-surface-variant">
                                            {auction.customer_name || 'N/A'}
                                        </td>
                                        <td className="py-md px-md text-right">
                                            {auction.featured && (
                                                <span className="material-symbols-outlined text-yellow-400 text-sm mr-sm">star</span>
                                            )}
                                            <button
                                                onClick={() => openEditModal(auction)}
                                                className="text-secondary-container hover:text-white transition-colors p-xs"
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(auction.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors p-xs ml-sm"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredAuctions.length === 0 && (
                            <div className="text-center py-xl text-on-surface-variant">
                                No auctions found
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'requests' && (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Customer</th>
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Vehicle Requested</th>
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Max Budget</th>
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Status</th>
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(request => (
                                <tr key={request.id} className="border-b border-white/5 hover:bg-primary-container/50 transition-colors">
                                    <td className="py-md px-md">
                                        <div className="font-body-md text-white">{request.customer_name}</div>
                                        <div className="font-caption text-on-surface-variant">{request.customer_email}</div>
                                    </td>
                                    <td className="py-md px-md font-body-md text-white">
                                        {request.vehicle_year} {request.vehicle_make} {request.vehicle_model}
                                    </td>
                                    <td className="py-md px-md font-body-md text-secondary-container">
                                        ${parseFloat(request.max_budget).toLocaleString()}
                                    </td>
                                    <td className="py-md px-md">
                                        <select
                                            value={request.status}
                                            onChange={(e) => handleRequestStatusChange(request.id, e.target.value)}
                                            className={`px-sm py-xs rounded-full font-caption cursor-pointer border border-white/20 ${getStatusColor(request.status)}`}
                                            style={{ appearance: 'auto' }}
                                        >
                                            <option value="pending" className="bg-surface-container text-white">Pending</option>
                                            <option value="searching" className="bg-surface-container text-white">Searching</option>
                                            <option value="found" className="bg-surface-container text-white">Found</option>
                                            <option value="bidding" className="bg-surface-container text-white">Bidding</option>
                                            <option value="won" className="bg-surface-container text-white">Won</option>
                                            <option value="lost" className="bg-surface-container text-white">Lost</option>
                                            <option value="completed" className="bg-surface-container text-white">Completed</option>
                                            <option value="cancelled" className="bg-surface-container text-white">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="py-md px-md font-caption text-on-surface-variant">
                                        {new Date(request.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {requests.length === 0 && (
                        <div className="text-center py-xl text-on-surface-variant">
                            No customer requests
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md overflow-y-auto">
                    <div className="bg-surface-container rounded-xl p-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-lg">
                            <h3 className="font-headline-md text-white">
                                {editingAuction ? 'Edit Auction' : 'New Auction'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-on-surface-variant hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-md">
                            <div className="border-b border-white/10 pb-md">
                                <h4 className="font-title-md text-white mb-md">Vehicle Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Year *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.vehicle_year}
                                            onChange={(e) => setFormData({...formData, vehicle_year: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Make *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.vehicle_make}
                                            onChange={(e) => setFormData({...formData, vehicle_make: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Model *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.vehicle_model}
                                            onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-white/10 pb-md">
                                <h4 className="font-title-md text-white mb-md">Auction Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Platform *</label>
                                        <select
                                            required
                                            value={formData.auction_platform}
                                            onChange={(e) => setFormData({...formData, auction_platform: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        >
                                            <option value="">Select Platform</option>
                                            <option value="Copart">Copart</option>
                                            <option value="IAAI">IAAI</option>
                                            <option value="Manheim">Manheim</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Location *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.auction_location}
                                            onChange={(e) => setFormData({...formData, auction_location: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Status *</label>
                                        <select
                                            required
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        >
                                            <option value="upcoming">Upcoming</option>
                                            <option value="live">Live</option>
                                            <option value="bidding">Bidding</option>
                                            <option value="won">Won</option>
                                            <option value="lost">Lost</option>
                                            <option value="pending_payment">Pending Payment</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Title Status *</label>
                                        <select
                                            required
                                            value={formData.title_status}
                                            onChange={(e) => setFormData({...formData, title_status: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        >
                                            <option value="clean">Clean</option>
                                            <option value="salvage">Salvage</option>
                                            <option value="rebuilt">Rebuilt</option>
                                            <option value="parts_only">Parts Only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-white/10 pb-md">
                                <h4 className="font-title-md text-white mb-md">Pricing</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Current Bid</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.current_bid}
                                            onChange={(e) => setFormData({...formData, current_bid: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Buy Now Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.buy_now_price}
                                            onChange={(e) => setFormData({...formData, buy_now_price: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Market Value</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.market_value}
                                            onChange={(e) => setFormData({...formData, market_value: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-md">
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.featured}
                                        onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                                        className="w-5 h-5"
                                    />
                                    <span className="font-label-md text-white">Feature on public page</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-md pt-md">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-lg py-sm rounded-lg font-bold text-on-surface-variant hover:bg-surface-container transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all"
                                >
                                    {editingAuction ? 'Update Auction' : 'Create Auction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AuctionManager;
