import React, { useState, useEffect } from 'react';
import { exportToCSV } from '../../utils/csvExport';
import DockReceiptGenerator from './DockReceiptGenerator';

function ShipmentsManager() {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingShipment, setEditingShipment] = useState(null);
    const [notification, setNotification] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedShipmentForReceipt, setSelectedShipmentForReceipt] = useState(null);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [shippingTypes, setShippingTypes] = useState([]);
    const [shippingLines, setShippingLines] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Column visibility state with localStorage persistence
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('shipments_visible_columns');
        return saved ? JSON.parse(saved) : {
            reference: true,
            customer: true,
            vehicle: true,
            route: true,
            status: true,
            progress: true,
            eta: true,
            shipping_type: false,
            shipping_line: false,
            vin: false,
            color: false,
            year: false,
            client_name: false,
            vessel: false,
            container: true,
            c_number: true,
            shipping_fee: true
        };
    });

    // Save column visibility to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('shipments_visible_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    const toggleColumn = (columnKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const allColumns = [
        { key: 'reference', label: 'Reference', default: true },
        { key: 'customer', label: 'Customer', default: true },
        { key: 'vehicle', label: 'Vehicle', default: true },
        { key: 'route', label: 'Route', default: true },
        { key: 'status', label: 'Status', default: true },
        { key: 'progress', label: 'Progress', default: true },
        { key: 'eta', label: 'ETA', default: true },
        { key: 'shipping_type', label: 'Shipping Type', default: false },
        { key: 'shipping_line', label: 'Shipping Line', default: false },
        { key: 'vin', label: 'VIN', default: false },
        { key: 'color', label: 'Color', default: false },
        { key: 'year', label: 'Year', default: false },
        { key: 'client_name', label: 'Client Name', default: false },
        { key: 'image_link', label: 'Vehicle Image', default: false },
        { key: 'vessel', label: 'Vessel', default: false },
        { key: 'container', label: 'Container #', default: true },
        { key: 'c_number', label: 'C Number', default: true },
        { key: 'shipping_fee', label: 'S/Fee (Status)', default: true }
    ];

    const handleExportCSV = () => {
        const exportData = filteredShipments.map(shipment => ({
            'Reference Number': shipment.reference_number,
            'Tracking Number': shipment.tracking_number,
            'Customer Name': shipment.customer_name,
            'Customer Email': shipment.customer_email,
            'Customer Phone': shipment.customer_phone || '',
            'Vehicle': shipment.vehicle || '',
            'Origin': shipment.origin,
            'Destination': shipment.destination,
            'Status': shipment.status,
            'Progress': shipment.progress_percentage + '%',
            'Shipping Provider': shipment.shipping_provider || '',
            'Vessel Name': shipment.vessel_name || '',
            'Container Number': shipment.container_number || '',
            'Estimated Arrival': shipment.estimated_arrival_date || '',
            'Actual Arrival': shipment.actual_arrival_date || '',
            'Delivery Date': shipment.delivery_date || '',
            'Total Cost': shipment.total_cost || '',
            'Created At': shipment.created_at
        }));
        
        const filename = `shipments_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
        showNotification('Shipments exported successfully', 'success');
    };

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: '',
        vehicle_vin: '',
        vehicle_description: '',
        car_model: '',
        year: '',
        car_color: '',
        image_link: '',
        vin: '',
        client_name: '',
        shipping_type_id: '',
        shipping_line_id: '',
        eta: '',
        origin_port: '',
        origin_country: '',
        destination_port: '',
        destination_country: '',
        shipping_provider: '',
        vessel_name: '',
        container_number: '',
        booking_number: '',
        status: 'pending',
        auction_date: '',
        shipping_date: '',
        departure_date: '',
        estimated_arrival_date: '',
        actual_arrival_date: '',
        delivery_date: '',
        total_cost: '',
        shipping_fee: '',
        shipping_fee_status: 'UNPAID',
        c_number: '',
        notes: '',
        admin_notes: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchShipments();
        }, 300);
        return () => clearTimeout(timer);
    }, [sortBy, sortOrder, searchQuery]);

    useEffect(() => {
        fetchShippingConfig();
    }, []);

    const fetchShippingConfig = async () => {
        try {
            const [typesRes, linesRes] = await Promise.all([
                fetch('/api/admin/shipping-types'),
                fetch('/api/admin/shipping-lines')
            ]);
            const types = await typesRes.json();
            const lines = await linesRes.json();
            setShippingTypes(Array.isArray(types) ? types.filter(t => t.is_active) : []);
            setShippingLines(Array.isArray(lines) ? lines.filter(l => l.is_active) : []);
        } catch (error) {
            console.error('Error fetching shipping config:', error);
        }
    };

    const fetchShipments = async () => {
        try {
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            const response = await fetch(`/api/admin/shipments?sort_by=${sortBy}&sort_order=${sortOrder}${searchParam}`);
            const data = await response.json();
            setShipments(data);
        } catch (error) {
            console.error('Error fetching shipments:', error);
            showNotification('Failed to load shipments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingShipment 
                ? `/api/admin/shipments/${editingShipment.id}`
                : '/api/admin/shipments';
            
            const method = editingShipment ? 'PUT' : 'POST';

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
                    editingShipment ? 'Shipment updated successfully' : 'Shipment created successfully',
                    'success'
                );
                setShowModal(false);
                resetForm();
                fetchShipments();
            } else {
                showNotification(data.message || 'Failed to save shipment', 'error');
            }
        } catch (error) {
            console.error('Error saving shipment:', error);
            showNotification('Failed to save shipment', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this shipment?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/shipments/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Shipment deleted successfully', 'success');
                fetchShipments();
            } else {
                showNotification('Failed to delete shipment', 'error');
            }
        } catch (error) {
            console.error('Error deleting shipment:', error);
            showNotification('Failed to delete shipment', 'error');
        }
    };

    const openEditModal = (shipment) => {
        setEditingShipment(shipment);
        setFormData({
            customer_name: shipment.customer_name || '',
            customer_email: shipment.customer_email || '',
            customer_phone: shipment.customer_phone || '',
            vehicle_make: shipment.vehicle_make || '',
            vehicle_model: shipment.vehicle_model || '',
            vehicle_year: shipment.vehicle_year || '',
            vehicle_vin: shipment.vehicle_vin || '',
            vehicle_description: shipment.vehicle_description || '',
            car_model: shipment.car_model || '',
            year: shipment.year || '',
            car_color: shipment.car_color || '',
            image_link: shipment.image_link || '',
            vin: shipment.vin || '',
            client_name: shipment.client_name || '',
            shipping_type_id: shipment.shipping_type_id || '',
            shipping_line_id: shipment.shipping_line_id || '',
            eta: shipment.eta || '',
            origin_port: shipment.origin_port || '',
            origin_country: shipment.origin_country || '',
            destination_port: shipment.destination_port || '',
            destination_country: shipment.destination_country || '',
            shipping_provider: shipment.shipping_provider || '',
            vessel_name: shipment.vessel_name || '',
            container_number: shipment.container_number || '',
            booking_number: shipment.booking_number || '',
            status: shipment.status || 'pending',
            auction_date: shipment.auction_date || '',
            shipping_date: shipment.shipping_date || '',
            departure_date: shipment.departure_date || '',
            estimated_arrival_date: shipment.estimated_arrival_date || '',
            actual_arrival_date: shipment.actual_arrival_date || '',
            delivery_date: shipment.delivery_date || '',
            total_cost: shipment.total_cost || '',
            shipping_fee: shipment.shipping_fee || '',
            shipping_fee_status: shipment.shipping_fee_status || 'UNPAID',
            c_number: shipment.c_number || '',
            notes: shipment.notes || '',
            admin_notes: shipment.admin_notes || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingShipment(null);
        setFormData({
            customer_name: '',
            customer_email: '',
            customer_phone: '',
            vehicle_make: '',
            vehicle_model: '',
            vehicle_year: '',
            vehicle_vin: '',
            vehicle_description: '',
            car_model: '',
            year: '',
            car_color: '',
            image_link: '',
            vin: '',
            client_name: '',
            shipping_type_id: '',
            shipping_line_id: '',
            eta: '',
            origin_port: '',
            origin_country: '',
            destination_port: '',
            destination_country: '',
            shipping_provider: '',
            vessel_name: '',
            container_number: '',
            booking_number: '',
            status: 'pending',
            auction_date: '',
            shipping_date: '',
            departure_date: '',
            estimated_arrival_date: '',
            actual_arrival_date: '',
            delivery_date: '',
            total_cost: '',
            shipping_fee: '',
            shipping_fee_status: 'UNPAID',
            c_number: '',
            notes: '',
            admin_notes: ''
        });
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
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
        return (
            <span className="material-symbols-outlined text-xs text-secondary">
                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
            </span>
        );
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-gray-500/20 text-gray-400',
            auction_won: 'bg-blue-500/20 text-blue-400',
            documentation: 'bg-yellow-500/20 text-yellow-400',
            shipping: 'bg-purple-500/20 text-purple-400',
            in_transit: 'bg-cyan-500/20 text-cyan-400',
            customs: 'bg-orange-500/20 text-orange-400',
            delivered: 'bg-green-500/20 text-green-400',
            cancelled: 'bg-red-500/20 text-red-400'
        };
        return colors[status] || colors.pending;
    };

    const filteredShipments = filter === 'all' 
        ? shipments 
        : shipments.filter(s => s.status === filter);

    const totalPages = Math.max(1, Math.ceil(filteredShipments.length / itemsPerPage));
    const paginatedShipments = filteredShipments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery, sortBy, sortOrder]);

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
                        Shipment Management
                    </h2>
                    <p className="font-body-md text-on-surface-variant">
                        Manage all shipments and tracking information
                    </p>
                </div>
                <div className="flex items-center gap-md">
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            className="bg-surface-container-high text-on-surface px-md py-sm rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-sm border border-outline-variant"
                        >
                            <span className="material-symbols-outlined text-sm">view_column</span>
                            Columns
                        </button>
                        {showColumnSelector && (
                            <div className="absolute top-full right-0 mt-xs bg-surface-container border border-outline-variant rounded-lg shadow-lg z-50 w-64 max-h-96 overflow-y-auto">
                                <div className="p-md border-b border-white/10">
                                    <div className="font-label-md text-white mb-xs">Show/Hide Columns</div>
                                    <div className="font-caption text-on-surface-variant">Customize table view</div>
                                </div>
                                <div className="p-sm">
                                    {allColumns.map(column => (
                                        <label
                                            key={column.key}
                                            className="flex items-center gap-sm p-sm hover:bg-surface-container-highest rounded cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns[column.key]}
                                                onChange={() => toggleColumn(column.key)}
                                                className="rounded border-outline"
                                            />
                                            <span className="font-body-sm text-on-surface">{column.label}</span>
                                            {column.default && (
                                                <span className="ml-auto text-xs text-on-surface-variant bg-surface-container-highest px-xs py-0.5 rounded">Default</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                <div className="p-sm border-t border-white/10">
                                    <button
                                        onClick={() => {
                                            const defaultColumns = {};
                                            allColumns.forEach(col => {
                                                defaultColumns[col.key] = col.default;
                                            });
                                            setVisibleColumns(defaultColumns);
                                        }}
                                        className="w-full text-center py-xs text-secondary-container hover:text-white transition-colors font-label-sm"
                                    >
                                        Reset to Default
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex bg-primary-container rounded-lg p-xs">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-md py-xs rounded-lg font-label-md transition-all flex items-center gap-xs ${viewMode === 'table' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">table_rows</span>
                            Table
                        </button>
                        <button
                            onClick={() => setViewMode('pipeline')}
                            className={`px-md py-xs rounded-lg font-label-md transition-all flex items-center gap-xs ${viewMode === 'pipeline' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">view_kanban</span>
                            Pipeline
                        </button>
                    </div>
                    <button
                        onClick={handleExportCSV}
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
                        New Shipment
                    </button>
                </div>
            </div>

            {viewMode === 'table' && (
                <div className="mb-md">
                    <div className="relative max-w-md">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by reference, customer, vehicle, container, C number, VIN..."
                            className="w-full bg-surface-container-lowest border border-white/20 text-white pl-2xl pr-md py-sm rounded-lg focus:outline-none focus:border-secondary-container placeholder:text-on-surface-variant/50"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'table' && (
                <div className="flex gap-sm mb-md overflow-x-auto">
                    {['all', 'pending', 'auction_won', 'shipping', 'in_transit', 'delivered'].map(status => (
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
            )}

            {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            {visibleColumns.reference && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('reference_number')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        Reference
                                        <SortIcon column="reference_number" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.customer && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('customer_name')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        Customer
                                        <SortIcon column="customer_name" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.vehicle && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('car_model')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        Vehicle
                                        <SortIcon column="car_model" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.vin && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('vin')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        VIN
                                        <SortIcon column="vin" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.year && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('year')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        Year
                                        <SortIcon column="year" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.color && <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Color</th>}
                            {visibleColumns.client_name && <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Client</th>}
                            {visibleColumns.image_link && <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Vehicle Image</th>}
                            {visibleColumns.route && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('origin_port')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        Route
                                        <SortIcon column="origin_port" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.shipping_type && <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Shipping Type</th>}
                            {visibleColumns.shipping_line && <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Shipping Line</th>}
                            {visibleColumns.vessel && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('vessel_name')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        Vessel
                                        <SortIcon column="vessel_name" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.container && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('container_number')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        Container
                                        <SortIcon column="container_number" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.c_number && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('c_number')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        C Number
                                        <SortIcon column="c_number" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.status && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('status')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        Status
                                        <SortIcon column="status" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.progress && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('progress_percentage')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        Progress
                                        <SortIcon column="progress_percentage" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.eta && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('eta')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        ETA
                                        <SortIcon column="eta" />
                                    </button>
                                </th>
                            )}
                            {visibleColumns.shipping_fee && (
                                <th className="text-left py-sm px-md font-label-md text-on-surface-variant">
                                    <button 
                                        onClick={() => handleSort('shipping_fee')}
                                        className="flex items-center gap-xs hover:text-secondary transition-colors"
                                    >
                                        S/Fee (Status)
                                        <SortIcon column="shipping_fee" />
                                    </button>
                                </th>
                            )}
                            <th className="text-right py-sm px-md font-label-md text-on-surface-variant">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedShipments.map(shipment => (
                            <tr key={shipment.id} className="border-b border-white/5 hover:bg-primary-container/50 transition-colors">
                                {visibleColumns.reference && (
                                    <td className="py-md px-md">
                                        <div className="font-label-md text-white">{shipment.reference_number}</div>
                                        <div className="font-caption text-on-surface-variant">{shipment.tracking_number}</div>
                                    </td>
                                )}
                                {visibleColumns.customer && (
                                    <td className="py-md px-md">
                                        <div className="font-body-md text-white">{shipment.customer_name}</div>
                                        <div className="font-caption text-on-surface-variant">{shipment.customer_email}</div>
                                    </td>
                                )}
                                {visibleColumns.vehicle && (
                                    <td className="py-md px-md font-body-md text-on-surface-variant">
                                        {shipment.car_model || shipment.vehicle || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.vin && (
                                    <td className="py-md px-md font-caption text-on-surface-variant font-mono">
                                        {shipment.vin || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.year && (
                                    <td className="py-md px-md font-caption text-on-surface-variant">
                                        {shipment.year || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.color && (
                                    <td className="py-md px-md font-caption text-on-surface-variant">
                                        {shipment.car_color || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.client_name && (
                                    <td className="py-md px-md font-caption text-on-surface-variant">
                                        {shipment.client_name || shipment.customer_name || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.image_link && (
                                    <td className="py-md px-md">
                                        {shipment.image_link ? (
                                            <a href={shipment.image_link} target="_blank" rel="noopener noreferrer" className="inline-block">
                                                <img 
                                                    src={shipment.image_link} 
                                                    alt="Vehicle" 
                                                    className="w-16 h-16 object-cover rounded-lg border border-white/10 hover:border-secondary-container transition-colors"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<span class="text-on-surface-variant text-xs">No image</span>';
                                                    }}
                                                />
                                            </a>
                                        ) : (
                                            <span className="text-on-surface-variant text-xs">No image</span>
                                        )}
                                    </td>
                                )}
                                {visibleColumns.route && (
                                    <td className="py-md px-md">
                                        <div className="font-caption text-on-surface-variant">{shipment.origin}</div>
                                        <div className="font-caption text-secondary-container">→ {shipment.destination}</div>
                                    </td>
                                )}
                                {visibleColumns.shipping_type && (
                                    <td className="py-md px-md font-caption text-on-surface-variant">
                                        {shipment.shipping_type_name || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.shipping_line && (
                                    <td className="py-md px-md font-caption text-on-surface-variant">
                                        {shipment.shipping_line_name || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.vessel && (
                                    <td className="py-md px-md font-caption text-on-surface-variant">
                                        {shipment.vessel_name || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.container && (
                                    <td className="py-md px-md font-caption text-on-surface-variant font-mono">
                                        {shipment.container_number || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.c_number && (
                                    <td className="py-md px-md font-caption text-on-surface-variant font-mono">
                                        {shipment.c_number || 'N/A'}
                                    </td>
                                )}
                                {visibleColumns.status && (
                                    <td className="py-md px-md">
                                        <span className={`px-sm py-xs rounded-full font-caption ${getStatusColor(shipment.status)}`}>
                                            {shipment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    </td>
                                )}
                                {visibleColumns.progress && (
                                    <td className="py-md px-md">
                                        <div className="flex items-center gap-sm">
                                            <div className="flex-1 h-2 bg-primary-container rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-secondary-container rounded-full transition-all"
                                                    style={{width: `${shipment.progress_percentage}%`}}
                                                ></div>
                                            </div>
                                            <span className="font-caption text-on-surface-variant">{shipment.progress_percentage}%</span>
                                        </div>
                                    </td>
                                )}
                                {visibleColumns.eta && (
                                    <td className="py-md px-md font-caption text-on-surface-variant">
                                        {shipment.eta || shipment.estimated_arrival_date || 'TBD'}
                                    </td>
                                )}
                                {visibleColumns.shipping_fee && (
                                    <td className="py-md px-md">
                                        <div className="font-body-md text-white">
                                            {shipment.shipping_fee ? `$${parseFloat(shipment.shipping_fee).toFixed(2)}` : 'N/A'}
                                        </div>
                                        <span className={`inline-block px-sm py-xs rounded-full font-caption text-xs ${
                                            shipment.shipping_fee_status === 'PAID' 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : 'bg-orange-500/20 text-orange-400'
                                        }`}>
                                            {shipment.shipping_fee_status || 'UNPAID'}
                                        </span>
                                    </td>
                                )}
                                <td className="py-md px-md text-right">
                                    <button
                                        onClick={() => {
                                            setSelectedShipmentForReceipt(shipment);
                                            setShowReceiptModal(true);
                                        }}
                                        className="text-blue-400 hover:text-blue-300 transition-colors p-xs"
                                        title="Generate Dock Receipt"
                                    >
                                        <span className="material-symbols-outlined">receipt_long</span>
                                    </button>
                                    <button
                                        onClick={() => openEditModal(shipment)}
                                        className="text-secondary-container hover:text-white transition-colors p-xs ml-sm"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(shipment.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors p-xs ml-sm"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                    {filteredShipments.length === 0 && (
                        <div className="text-center py-xl text-on-surface-variant">
                            No shipments found
                        </div>
                    )}

                    {filteredShipments.length > 0 && (
                        <div className="flex items-center justify-between mt-md pt-md border-t border-white/10">
                            <span className="font-caption text-on-surface-variant">
                                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredShipments.length)} of {filteredShipments.length}
                            </span>
                            <div className="flex items-center gap-xs">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-xs rounded-lg bg-surface-container-high text-on-surface disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                <span className="font-caption text-on-surface-variant px-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-xs rounded-lg bg-surface-container-high text-on-surface disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="flex gap-md min-w-max pb-md">
                        {['pending', 'auction_won', 'documentation', 'shipping', 'in_transit', 'customs', 'delivered'].map(status => {
                            const statusShipments = shipments.filter(s => s.status === status);
                            return (
                                <div key={status} className="flex-shrink-0 w-80">
                                    <div className="bg-primary-container rounded-xl p-md">
                                        <div className="flex items-center justify-between mb-md">
                                            <h3 className="font-title-md text-white">
                                                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h3>
                                            <span className={`px-sm py-xs rounded-full font-caption ${getStatusColor(status)}`}>
                                                {statusShipments.length}
                                            </span>
                                        </div>
                                        <div className="space-y-sm max-h-[600px] overflow-y-auto">
                                            {statusShipments.map(shipment => (
                                                <div
                                                    key={shipment.id}
                                                    className="bg-surface-container rounded-lg p-md border border-white/5 hover:border-secondary-container/50 transition-all cursor-pointer"
                                                    onClick={() => openEditModal(shipment)}
                                                >
                                                    <div className="flex items-start justify-between mb-sm">
                                                        <div className="flex-1">
                                                            <div className="font-label-md text-white mb-xs">
                                                                {shipment.reference_number}
                                                            </div>
                                                            <div className="font-caption text-on-surface-variant">
                                                                {shipment.customer_name}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(shipment.id);
                                                            }}
                                                            className="text-red-400 hover:text-red-300 transition-colors p-xs"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                    
                                                    {shipment.vehicle && (
                                                        <div className="flex items-center gap-xs mb-sm">
                                                            <span className="material-symbols-outlined text-secondary-container text-sm">directions_car</span>
                                                            <span className="font-caption text-on-surface-variant">{shipment.vehicle}</span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-xs mb-sm">
                                                        <span className="material-symbols-outlined text-secondary-container text-sm">location_on</span>
                                                        <div className="flex-1">
                                                            <div className="font-caption text-on-surface-variant">{shipment.origin}</div>
                                                            <div className="font-caption text-secondary-container">→ {shipment.destination}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-md pt-sm border-t border-white/5">
                                                        <div className="flex items-center justify-between mb-xs">
                                                            <span className="font-caption text-on-surface-variant">Progress</span>
                                                            <span className="font-caption text-white">{shipment.progress_percentage}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-secondary-container rounded-full transition-all"
                                                                style={{width: `${shipment.progress_percentage}%`}}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    
                                                    {shipment.estimated_arrival_date && (
                                                        <div className="flex items-center gap-xs mt-sm">
                                                            <span className="material-symbols-outlined text-on-surface-variant text-sm">schedule</span>
                                                            <span className="font-caption text-on-surface-variant">ETA: {shipment.estimated_arrival_date}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {statusShipments.length === 0 && (
                                                <div className="text-center py-lg text-on-surface-variant font-caption">
                                                    No shipments
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md overflow-y-auto">
                    <div className="bg-surface-container rounded-xl p-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-lg">
                            <h3 className="font-headline-md text-white">
                                {editingShipment ? 'Edit Shipment' : 'New Shipment'}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">Customer Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.customer_name}
                                        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">Customer Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.customer_email}
                                        onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">Customer Phone</label>
                                <input
                                    type="tel"
                                    value={formData.customer_phone}
                                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                />
                            </div>

                            <div className="border-t border-white/10 pt-md">
                                <h4 className="font-title-md text-white mb-md">Vehicle Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Year</label>
                                        <input
                                            type="text"
                                            value={formData.vehicle_year}
                                            onChange={(e) => setFormData({...formData, vehicle_year: e.target.value, year: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Make</label>
                                        <input
                                            type="text"
                                            value={formData.vehicle_make}
                                            onChange={(e) => {
                                                const newMake = e.target.value;
                                                const carModel = `${newMake} ${formData.vehicle_model}`.trim();
                                                setFormData({...formData, vehicle_make: newMake, car_model: carModel});
                                            }}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Model</label>
                                        <input
                                            type="text"
                                            value={formData.vehicle_model}
                                            onChange={(e) => {
                                                const newModel = e.target.value;
                                                const carModel = `${formData.vehicle_make} ${newModel}`.trim();
                                                setFormData({...formData, vehicle_model: newModel, car_model: carModel});
                                            }}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                </div>
                                <div className="mt-md">
                                    <label className="block font-label-md text-on-surface-variant mb-xs">VIN</label>
                                    <input
                                        type="text"
                                        value={formData.vehicle_vin}
                                        onChange={(e) => setFormData({...formData, vehicle_vin: e.target.value, vin: e.target.value})}
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-md">
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Color</label>
                                        <input
                                            type="text"
                                            value={formData.car_color}
                                            onChange={(e) => setFormData({...formData, car_color: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                            placeholder="e.g., Black, White, Red"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Client Name</label>
                                        <input
                                            type="text"
                                            value={formData.client_name}
                                            onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                            placeholder="Client or company name"
                                        />
                                    </div>
                                </div>
                                <div className="mt-md">
                                    <label className="block font-label-md text-on-surface-variant mb-xs flex items-center gap-xs">
                                        <span className="material-symbols-outlined text-sm">image</span>
                                        Vehicle Image
                                    </label>
                                    <div className="space-y-sm">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                const formDataUpload = new FormData();
                                                formDataUpload.append('image', file);

                                                try {
                                                    const response = await fetch('/api/admin/upload/vehicle-image', {
                                                        method: 'POST',
                                                        body: formDataUpload
                                                    });

                                                    const result = await response.json();
                                                    
                                                    if (result.success) {
                                                        setFormData({...formData, image_link: result.data.url});
                                                        showNotification('Image uploaded successfully', 'success');
                                                    } else {
                                                        showNotification('Failed to upload image', 'error');
                                                    }
                                                } catch (error) {
                                                    console.error('Upload error:', error);
                                                    showNotification('Failed to upload image', 'error');
                                                }
                                            }}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-secondary-container file:text-on-secondary-container hover:file:opacity-90"
                                        />
                                        <p className="text-xs text-on-surface-variant">
                                            📸 Upload vehicle image (JPG, PNG, GIF, WebP - Max 5MB)
                                        </p>
                                        {formData.image_link && (
                                            <div className="mt-sm p-sm bg-surface-container rounded-lg">
                                                <div className="flex items-start justify-between mb-xs">
                                                    <p className="text-xs text-on-surface-variant">Preview:</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({...formData, image_link: ''})}
                                                        className="text-xs text-red-400 hover:text-red-300"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                <img 
                                                    src={formData.image_link} 
                                                    alt="Vehicle preview" 
                                                    className="w-full max-w-xs h-auto object-cover rounded border border-white/10"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling.style.display = 'block';
                                                    }}
                                                />
                                                <div style={{display: 'none'}} className="text-xs text-red-400 p-sm">
                                                    ⚠️ Image failed to load
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-md">
                                <h4 className="font-title-md text-white mb-md">Shipping Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Origin Port *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.origin_port}
                                            onChange={(e) => setFormData({...formData, origin_port: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Origin Country *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.origin_country}
                                            onChange={(e) => setFormData({...formData, origin_country: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Destination Port *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.destination_port}
                                            onChange={(e) => setFormData({...formData, destination_port: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Destination Country *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.destination_country}
                                            onChange={(e) => setFormData({...formData, destination_country: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-md mt-md">
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Shipping Type</label>
                                        <select
                                            value={formData.shipping_type_id}
                                            onChange={(e) => setFormData({...formData, shipping_type_id: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        >
                                            <option value="">Select Shipping Type</option>
                                            {shippingTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Shipping Line</label>
                                        <select
                                            value={formData.shipping_line_id}
                                            onChange={(e) => {
                                                const lineId = e.target.value;
                                                const line = shippingLines.find(l => String(l.id) === lineId);
                                                setFormData({...formData, shipping_line_id: lineId, shipping_provider: line ? line.name : ''});
                                            }}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        >
                                            <option value="">Select Shipping Line</option>
                                            {shippingLines.map(line => (
                                                <option key={line.id} value={line.id}>{line.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Vessel Name</label>
                                        <input
                                            type="text"
                                            value={formData.vessel_name}
                                            onChange={(e) => setFormData({...formData, vessel_name: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Container Number</label>
                                        <input
                                            type="text"
                                            value={formData.container_number}
                                            onChange={(e) => setFormData({...formData, container_number: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                </div>
                                <div className="mt-md">
                                    <label className="block font-label-md text-on-surface-variant mb-xs">C Number</label>
                                    <input
                                        type="text"
                                        value={formData.c_number}
                                        onChange={(e) => setFormData({...formData, c_number: e.target.value})}
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        placeholder="Enter C number"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-md">
                                <h4 className="font-title-md text-white mb-md">Status & Dates</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Status *</label>
                                        <select
                                            required
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="auction_won">Auction Won</option>
                                            <option value="documentation">Documentation</option>
                                            <option value="shipping">Shipping</option>
                                            <option value="in_transit">In Transit</option>
                                            <option value="customs">Customs</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Estimated Arrival (ETA)</label>
                                        <input
                                            type="date"
                                            value={formData.estimated_arrival_date}
                                            onChange={(e) => setFormData({...formData, estimated_arrival_date: e.target.value, eta: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-md">
                                <h4 className="font-title-md text-white mb-md">Financial Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Shipping Fee</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.shipping_fee}
                                            onChange={(e) => setFormData({...formData, shipping_fee: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-label-md text-on-surface-variant mb-xs">Payment Status</label>
                                        <select
                                            value={formData.shipping_fee_status}
                                            onChange={(e) => setFormData({...formData, shipping_fee_status: e.target.value})}
                                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        >
                                            <option value="UNPAID">UNPAID</option>
                                            <option value="PAID">PAID</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-md">
                                <label className="block font-label-md text-on-surface-variant mb-xs">Notes (Visible to Customer)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    rows="3"
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                ></textarea>
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
                                    {editingShipment ? 'Update Shipment' : 'Create Shipment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReceiptModal && selectedShipmentForReceipt && (
                <DockReceiptGenerator
                    shipment={selectedShipmentForReceipt}
                    onClose={() => {
                        setShowReceiptModal(false);
                        setSelectedShipmentForReceipt(null);
                    }}
                    onGenerated={(data) => {
                        showNotification(`Receipt ${data.receipt_number} generated successfully`, 'success');
                    }}
                />
            )}
        </div>
    );
}

export default ShipmentsManager;
