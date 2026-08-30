import React, { useEffect, useState } from 'react';

const emptyForm = {
    item: '', client_name: '', shipping_type_id: '', shipping_line_id: '', status: 'not_cleared',
    date_stamp: '', total_paid: '', profit: '', is_active: true,
};

function ClearanceManager() {
    const [records, setRecords] = useState([]);
    const [types, setTypes] = useState([]);
    const [lines, setLines] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchRecords = async () => {
        try {
            const response = await fetch(`/api/admin/clearances?search=${encodeURIComponent(search)}&sort_by=date_stamp&sort_order=desc`);
            const data = await response.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            setMessage('Failed to load clearance records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchRecords, 200);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        Promise.all([fetch('/api/admin/shipping-types'), fetch('/api/admin/shipping-lines')])
            .then(async ([typesResponse, linesResponse]) => {
                const [typesData, linesData] = await Promise.all([typesResponse.json(), linesResponse.json()]);
                setTypes(typesData.filter((item) => item.is_active));
                setLines(linesData.filter((item) => item.is_active));
            })
            .catch(() => setMessage('Failed to load shipping configuration'));
    }, []);

    const update = (name, value) => setFormData({ ...formData, [name]: value });
    const edit = (record) => { setEditingId(record.id); setFormData({ ...emptyForm, ...record }); setShowModal(true); };
    const remove = async (id) => {
        if (!confirm('Delete this clearance record?')) return;
        const response = await fetch(`/api/admin/clearances/${id}`, { method: 'DELETE' });
        if (response.ok) fetchRecords();
    };

    const submit = async (event) => {
        event.preventDefault();
        const response = await fetch(editingId ? `/api/admin/clearances/${editingId}` : '/api/admin/clearances', {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const data = await response.json();
        setMessage(response.ok ? data.message : data.message || 'Unable to save clearance');
        if (response.ok) { setShowModal(false); setEditingId(null); setFormData(emptyForm); fetchRecords(); }
    };

    const importFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/admin/clearances/import', { method: 'POST', body });
        const data = await response.json();
        setMessage(data.message || 'Clearance import completed');
        if (response.ok) fetchRecords();
        event.target.value = '';
    };

    const exportFile = async () => {
        const response = await fetch('/api/admin/clearances/export');
        if (!response.ok) return setMessage('Clearance export failed');
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a');
        link.href = url;
        link.download = 'clearances_export.xlsx';
        link.click();
        URL.revokeObjectURL(url);
    };

    const totalPages = Math.max(1, Math.ceil(records.length / itemsPerPage));
    const paginatedRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return <div className="bg-surface-container rounded-xl p-lg border border-white/10">Loading clearance records...</div>;

    return (
        <div className="bg-surface-container rounded-xl p-lg border border-white/10">
            {message && <div className="mb-md p-md rounded-lg bg-green-500/20 text-green-400">{message}</div>}
            <div className="flex flex-col md:flex-row gap-md mb-lg md:items-center md:justify-between">
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search item, client, shipment type..." className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg py-2 px-md text-on-surface" />
                <div className="flex gap-sm">
                    <label className="bg-surface-container-high border border-outline-variant text-on-surface px-md py-sm rounded-lg font-bold cursor-pointer">Import<input type="file" accept=".xlsx,.xls" onChange={importFile} className="hidden" /></label>
                    <button onClick={exportFile} className="bg-surface-container-high border border-outline-variant text-on-surface px-md py-sm rounded-lg font-bold">Export</button>
                    <button onClick={() => { setEditingId(null); setFormData(emptyForm); setShowModal(true); }} className="bg-secondary text-on-secondary px-md py-sm rounded-lg font-bold">+ Add Clearance</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead><tr className="bg-[#0B3D2E] text-left">{['SN', 'ITEM', 'CLIENT NAME', 'SHIPMENT TYPE', 'SHIPPING LINE', 'STATUS', 'DATE STAMP', 'TOTAL PAID', 'PROFIT', 'Actions'].map((heading) => <th key={heading} className="px-md py-sm font-label-md text-white">{heading}</th>)}</tr></thead>
                    <tbody className="text-white">{paginatedRecords.map((record, index) => <tr key={record.id} className="border-b border-outline-variant hover:bg-surface-container-highest"><td className="px-md py-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td><td className="px-md py-sm">{record.item}</td><td className="px-md py-sm">{record.client_name}</td><td className="px-md py-sm">{record.shipping_type_name || '—'}</td><td className="px-md py-sm">{record.shipping_line_name || '—'}</td><td className={`px-md py-sm uppercase ${record.status === 'cleared' ? 'text-green-400' : 'text-amber-400'}`}>{record.status.replace('_', ' ')}</td><td className="px-md py-sm">{record.date_stamp || '—'}</td><td className="px-md py-sm">{record.total_paid || '—'}</td><td className="px-md py-sm">{record.profit || '—'}</td><td className="px-md py-sm"><button onClick={() => edit(record)} className="text-secondary mr-sm">Edit</button><button onClick={() => remove(record.id)} className="text-red-400">Delete</button></td></tr>)}</tbody>
                </table>
            </div>
            <div className="mt-lg flex items-center justify-between"><span className="text-sm text-on-surface-variant">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, records.length)} of {records.length}</span><div className="flex gap-sm"><button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="px-md py-sm rounded-lg border border-outline-variant disabled:opacity-40">Prev</button><span className="px-sm py-sm text-sm text-on-surface-variant">Page {currentPage} of {totalPages}</span><button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="px-md py-sm rounded-lg border border-outline-variant disabled:opacity-40">Next</button></div></div>
            {showModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md"><form onSubmit={submit} className="bg-surface-container rounded-xl border border-outline-variant w-full max-w-3xl p-lg space-y-lg"><div className="flex justify-between"><h3 className="text-xl font-bold">{editingId ? 'Edit Clearance' : 'Add Clearance'}</h3><button type="button" onClick={() => setShowModal(false)} className="material-symbols-outlined">close</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-md"><label>Item<input value={formData.item} onChange={(event) => update('item', event.target.value)} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm" /></label><label>Client Name<input value={formData.client_name} onChange={(event) => update('client_name', event.target.value)} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm" /></label><label>Shipment Type<select value={formData.shipping_type_id} onChange={(event) => update('shipping_type_id', event.target.value)} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm"><option value="">Select type</option>{types.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Shipping Line<select value={formData.shipping_line_id} onChange={(event) => update('shipping_line_id', event.target.value)} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm"><option value="">Select line</option>{lines.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Status<select value={formData.status} onChange={(event) => update('status', event.target.value)} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm"><option value="cleared">Cleared</option><option value="not_cleared">Not Cleared</option></select></label><label>Date Stamp<input type="date" value={formData.date_stamp} onChange={(event) => update('date_stamp', event.target.value)} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm" /></label><label>Total Paid<input type="number" step="0.01" value={formData.total_paid} onChange={(event) => update('total_paid', event.target.value)} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm" /></label><label>Profit<input type="number" step="0.01" value={formData.profit} onChange={(event) => update('profit', event.target.value)} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm" /></label></div><div className="flex justify-end gap-md"><button type="button" onClick={() => setShowModal(false)} className="px-md py-sm rounded-lg border border-outline-variant">Cancel</button><button className="bg-secondary text-on-secondary px-md py-sm rounded-lg font-bold">{editingId ? 'Update' : 'Create'}</button></div></form></div>}
        </div>
    );
}

export default ClearanceManager;
