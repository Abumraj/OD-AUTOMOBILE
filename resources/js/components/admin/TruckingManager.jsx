import React, { useState, useEffect } from 'react';

function ProcurementManager() {
    const [records, setRecords] = useState([]);
    const [shippingLines, setShippingLines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [notification, setNotification] = useState(null);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: '',
        trucking_date: '',
        color: '',
        vin: '',
        auction_site: 'copart',
        shipping_type: 'container',
        shipping_line_id: '',
        payment_status: 'unpaid',
        shipment_status: 'pending',
        location: '',
        tracking: '',
        trucking_fee_status: 'unpaid',
        status: 'pending',
        origin_port: '',
        origin_country: '',
        destination_port: '',
        destination_country: '',
        amount: '',
        profit: '',
        notes: '',
        admin_notes: '',
        is_active: true,
    });

    useEffect(() => {
        const timer = setTimeout(() => fetchTruckings(), 200);
        return () => clearTimeout(timer);
    }, [searchQuery, sortBy, sortOrder]);

    useEffect(() => {
        fetch('/api/admin/shipping-lines')
            .then((response) => response.json())
            .then((lines) => setShippingLines(lines.filter((line) => line.is_active)))
            .catch(() => showNotification('Failed to load shipping lines', 'error'));
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchTruckings = async () => {
        try {
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            const response = await fetch(`/api/admin/truckings?sort_by=${sortBy}&sort_order=${sortOrder}${searchParam}`);
            const data = await response.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching trucking records:', error);
            showNotification('Failed to load trucking records', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setImporting(true);
        setImportResult(null);

        try {
            const response = await fetch('/api/admin/truckings/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setImportResult(data);

            if (response.ok) {
                showNotification('Trucking import completed', 'success');
                await fetchTruckings();
            } else {
                showNotification(data.message || 'Import failed', 'error');
            }
        } catch (error) {
            setImportResult({ message: 'Error importing file', errors: [error.message] });
            showNotification('Trucking import failed', 'error');
        } finally {
            setImporting(false);
            event.target.value = '';
        }
    };

    const handleExport = async () => {
        setExporting(true);

        try {
            const response = await fetch('/api/admin/truckings/export');
            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `truckings_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showNotification('Trucking export started', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showNotification('Failed to export truckings', 'error');
        } finally {
            setExporting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingRecord ? `/api/admin/truckings/${editingRecord.id}` : '/api/admin/truckings';
            const method = editingRecord ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(editingRecord ? 'Procurement record updated successfully' : 'Procurement record created successfully', 'success');
                setShowModal(false);
                resetForm();
                fetchTruckings();
            } else {
                showNotification(data.message || 'Failed to save procurement record', 'error');
            }
        } catch (error) {
            console.error('Error saving procurement record:', error);
            showNotification('Failed to save procurement record', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this procurement record?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/truckings/${id}`, { method: 'DELETE' });
            if (response.ok) {
                showNotification('Procurement record deleted', 'success');
                fetchTruckings();
            } else {
                showNotification('Failed to delete procurement record', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Failed to delete procurement record', 'error');
        }
    };

    const resetForm = () => {
        setEditingRecord(null);
        setFormData({
            customer_name: '',
            customer_email: '',
            customer_phone: '',
            vehicle_make: '',
            vehicle_model: '',
            vehicle_year: '',
            trucking_date: '',
            color: '',
            vin: '',
            auction_site: 'copart',
            shipping_type: 'container',
            shipping_line_id: '',
            payment_status: 'unpaid',
            shipment_status: 'pending',
            location: '',
            tracking: '',
            trucking_fee_status: 'unpaid',
            status: 'pending',
            origin_port: '',
            origin_country: '',
            destination_port: '',
            destination_country: '',
            amount: '',
            profit: '',
            notes: '',
            admin_notes: '',
            is_active: true,
        });
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        setFormData({
            customer_name: record.customer_name || '',
            customer_email: record.customer_email || '',
            customer_phone: record.customer_phone || '',
            vehicle_make: record.vehicle_make || '',
            vehicle_model: record.vehicle_model || '',
            vehicle_year: record.vehicle_year || '',
            trucking_date: record.trucking_date || '',
            color: record.color || '',
            vin: record.vin || '',
            auction_site: record.auction_site || 'copart',
            shipping_type: record.shipping_type || 'container',
            shipping_line_id: record.shipping_line_id || '',
            payment_status: record.payment_status || record.trucking_fee_status || 'unpaid',
            shipment_status: record.shipment_status || record.status || 'pending',
            location: record.location || '',
            tracking: record.tracking || '',
            trucking_fee_status: record.trucking_fee_status || 'unpaid',
            status: record.status || 'pending',
            origin_port: record.origin_port || '',
            origin_country: record.origin_country || '',
            destination_port: record.destination_port || '',
            destination_country: record.destination_country || '',
            amount: record.amount || '',
            profit: record.profit || '',
            notes: record.notes || '',
            admin_notes: record.admin_notes || '',
            is_active: record.is_active ?? true,
        });
        setShowModal(true);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder(column === 'created_at' ? 'desc' : 'asc');
        }
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) {
            return <span className="material-symbols-outlined text-xs opacity-30">unfold_more</span>;
        }
        return <span className="material-symbols-outlined text-xs text-secondary">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>;
    };

    const getFeeColor = (status) => {
        return status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
    };

    const getStatusColor = (status) => {
        const map = {
            pending: 'bg-yellow-500/20 text-yellow-400',
            arrived: 'bg-green-500/20 text-green-400',
            'on_vessel': 'bg-blue-500/20 text-blue-400',
        };
        return map[status] || 'bg-gray-500/20 text-gray-400';
    };

    const filteredTruckings = records;
    const totalPages = Math.max(1, Math.ceil(filteredTruckings.length / itemsPerPage));
    const paginatedTruckings = filteredTruckings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy, sortOrder]);

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

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md mb-lg">
                <div className="flex-1">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search customer, vehicle, route..."
                            className="w-full bg-surface-container-high border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-on-surface focus:outline-none focus:border-secondary"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-sm">
                    <label className="bg-surface-container-high border border-outline-variant text-on-surface px-md py-sm rounded-lg font-bold cursor-pointer hover:opacity-90 transition-all">
                        <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" disabled={importing} />
                        {importing ? 'Importing...' : 'Import'}
                    </label>
                    <button type="button" onClick={handleExport} disabled={exporting} className="bg-secondary text-on-secondary px-md py-sm rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-60">
                        {exporting ? 'Exporting...' : 'Export'}
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-secondary text-on-secondary px-md py-sm rounded-lg font-bold hover:opacity-90 transition-all"
                    >
                        + Add Trucking
                    </button>
                </div>
            </div>

            {importResult && (
                <div className={`mb-md p-md rounded-lg ${importResult.errors?.length ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                    <div className="font-label-md text-white mb-xs">{importResult.message}</div>
                    {importResult.imported > 0 && <div className="text-green-400">Imported: {importResult.imported}</div>}
                    {importResult.errors?.length > 0 && (
                        <ul className="mt-sm list-disc pl-5 text-on-surface-variant text-sm">
                            {importResult.errors.map((error, index) => <li key={index}>{error}</li>)}
                        </ul>
                    )}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-surface-container-high text-left">
                            {['#', 'DATE', 'CAR MAKER', 'CAR MODEL', 'YEAR', 'SHIPPING TYPE', 'COLOR', 'CLIENT NAME', 'VIN', 'AMOUNT', 'PROFIT', 'PAYMENT STATUS', 'SHIPMENT STATUS', 'LOCATION', 'TRACKING', 'SHIPPING'].map((heading) => <th key={heading} className="px-md py-sm font-label-md text-on-surface-variant">{heading}</th>)}
                            <th className="px-md py-sm font-label-md text-on-surface-variant">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTruckings.map((record, index) => (
                            <tr key={record.id} className="border-b border-outline-variant hover:bg-surface-container-highest">
                                <td className="px-md py-sm text-on-surface">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td className="px-md py-sm text-on-surface">{record.trucking_date || '—'}</td>
                                <td className="px-md py-sm text-on-surface">{record.vehicle_make || '—'}</td>
                                <td className="px-md py-sm text-on-surface">{record.vehicle_model || '—'}</td>
                                <td className="px-md py-sm text-on-surface">{record.vehicle_year || '—'}</td>
                                <td className="px-md py-sm text-on-surface">{record.shipping_type || '—'}</td>
                                <td className="px-md py-sm text-on-surface">{record.color || '—'}</td>
                                <td className="px-md py-sm text-on-surface">{record.customer_name || '—'}</td>
                                <td className="px-md py-sm text-on-surface">{record.vin || '—'}</td>
                                <td className="px-md py-sm text-on-surface">${Number(record.amount || 0).toFixed(2)}</td>
                                <td className="px-md py-sm text-on-surface">${Number(record.profit || 0).toFixed(2)}</td>
                                <td className="px-md py-sm"><span className={`px-2 py-1 rounded-full text-xs uppercase font-medium ${getFeeColor(record.payment_status || record.trucking_fee_status)}`}>{record.payment_status || record.trucking_fee_status || 'unpaid'}</span></td>
                                <td className="px-md py-sm"><span className={`px-2 py-1 rounded-full text-xs uppercase font-medium ${getStatusColor(record.shipment_status || record.status)}`}>{record.shipment_status || record.status || 'pending'}</span></td>
                                <td className="px-md py-sm text-on-surface">{record.location || '—'}</td>
                                <td className="px-md py-sm text-on-surface">{record.tracking || '—'}</td>
                                <td className="px-md py-sm text-on-surface">{record.shipping_line_name || '—'}</td>
                                <td className="px-md py-sm">
                                    <div className="flex gap-sm">
                                        <button onClick={() => openEditModal(record)} className="text-secondary hover:opacity-80">Edit</button>
                                        <button onClick={() => handleDelete(record.id)} className="text-red-400 hover:opacity-80">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-lg flex items-center justify-between">
                <div className="text-sm text-on-surface-variant">Page {currentPage} of {totalPages}</div>
                <div className="flex gap-sm">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-md py-sm rounded-lg border border-outline-variant disabled:opacity-40"
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-md py-sm rounded-lg border border-outline-variant disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
                    <div className="bg-surface-container rounded-xl border border-outline-variant w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-lg border-b border-outline-variant">
                            <h3 className="text-xl font-bold text-on-surface">{editingRecord ? 'Edit Trucking Record' : 'Add Trucking Record'}</h3>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="material-symbols-outlined">close</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-lg space-y-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Customer Name</label>
                                    <input required value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Customer Email</label>
                                    <input type="email" value={formData.customer_email} onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Phone</label>
                                    <input value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Vehicle Year</label>
                                    <input value={formData.vehicle_year} onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Vehicle Make</label>
                                    <input value={formData.vehicle_make} onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Vehicle Model</label>
                                    <input value={formData.vehicle_model} onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Date</label>
                                    <input type="date" value={formData.trucking_date} onChange={(e) => setFormData({ ...formData, trucking_date: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Color</label>
                                    <input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">VIN</label>
                                    <input value={formData.vin} onChange={(e) => setFormData({ ...formData, vin: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Auction Site</label>
                                    <select value={formData.auction_site} onChange={(e) => setFormData({ ...formData, auction_site: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface">
                                        <option value="copart">Copart</option>
                                        <option value="iaai">IAAI</option>
                                        <option value="manheim">Manheim</option>
                                        <option value="avc">AVC</option>
                                        <option value="dealership">Dealership</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Shipping Type</label>
                                    <select value={formData.shipping_type} onChange={(e) => setFormData({ ...formData, shipping_type: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface">
                                        <option value="container">Container</option>
                                        <option value="roro">RoRo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Shipping</label>
                                    <select value={formData.shipping_line_id} onChange={(e) => setFormData({ ...formData, shipping_line_id: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface">
                                        <option value="">Select shipping line</option>
                                        {shippingLines.map((line) => <option key={line.id} value={line.id}>{line.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Trucking Fee</label>
                                    <select value={formData.trucking_fee_status} onChange={(e) => setFormData({ ...formData, trucking_fee_status: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface">
                                        <option value="paid">Paid</option>
                                        <option value="unpaid">Unpaid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface">
                                        <option value="pending">Pending</option>
                                        <option value="arrived">Arrived</option>
                                        <option value="on_vessel">On Vessel</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Payment Status</label>
                                    <select value={formData.payment_status} onChange={(e) => setFormData({ ...formData, payment_status: e.target.value, trucking_fee_status: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface">
                                        <option value="paid">Paid</option>
                                        <option value="unpaid">Unpaid</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Shipment Status</label>
                                    <select value={formData.shipment_status} onChange={(e) => setFormData({ ...formData, shipment_status: e.target.value, status: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface">
                                        <option value="pending">Pending</option>
                                        <option value="arrived">Arrived</option>
                                        <option value="on_vessel">On Vessel</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Location</label>
                                    <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Tracking</label>
                                    <input value={formData.tracking} onChange={(e) => setFormData({ ...formData, tracking: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Origin Port</label>
                                    <input value={formData.origin_port} onChange={(e) => setFormData({ ...formData, origin_port: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Destination Port</label>
                                    <input value={formData.destination_port} onChange={(e) => setFormData({ ...formData, destination_port: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Origin Country</label>
                                    <input value={formData.origin_country} onChange={(e) => setFormData({ ...formData, origin_country: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Destination Country</label>
                                    <input value={formData.destination_country} onChange={(e) => setFormData({ ...formData, destination_country: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Amount</label>
                                    <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-xs text-on-surface-variant">Profit</label>
                                    <input type="number" step="0.01" value={formData.profit} onChange={(e) => setFormData({ ...formData, profit: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm mb-xs text-on-surface-variant">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface min-h-[100px]" />
                            </div>

                            <div>
                                <label className="block text-sm mb-xs text-on-surface-variant">Admin Notes</label>
                                <textarea value={formData.admin_notes} onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })} className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface min-h-[100px]" />
                            </div>

                            <div className="flex items-center gap-sm">
                                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                                <label className="text-on-surface-variant">Active</label>
                            </div>

                            <div className="flex justify-end gap-md pt-md">
                                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-md py-sm rounded-lg border border-outline-variant text-on-surface">Cancel</button>
                                <button type="submit" className="bg-secondary text-on-secondary px-md py-sm rounded-lg font-bold">{editingRecord ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProcurementManager;
