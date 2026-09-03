import React, { useEffect, useState } from 'react';
import ServiceFilterBar from './ServiceFilterBar';

const emptyForm = {
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    date_procured: '',
    car_make: '',
    car_model: '',
    car_year: '',
    price_usd: '',
    auction_charge_usd: '',
    auction_site: 'copart',
    state: '',
    trucking: '',
    shipping: 'container',
    arrival_date: '',
    profit_ngn: '',
    trucking_fee: 'unpaid',
    status: 'pending',
    is_active: true,
};

function ProcurementManager() {
    const [records, setRecords] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState('');
    const [filters, setFilters] = useState({ date_from: '', date_to: '', status: '', shipping_type: '', column: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchRecords = async () => {
        try {
            const params = new URLSearchParams({ search, sort_by: 'arrival_date', sort_order: 'asc', date_from: filters.date_from, date_to: filters.date_to, status: filters.status, shipping_type: filters.shipping_type, auction_site: filters.column });
            const response = await fetch(`/api/admin/procurements?${params}`);
            const data = await response.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) { setMessage('Failed to load procurements'); }
        finally { setLoading(false); }
    };

    useEffect(() => { const timer = setTimeout(fetchRecords, 200); return () => clearTimeout(timer); }, [search, filters]);
    useEffect(() => { setCurrentPage(1); }, [search]);

    const submit = async (event) => {
        event.preventDefault();
        const response = await fetch(editingId ? `/api/admin/procurements/${editingId}` : '/api/admin/procurements', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const data = await response.json();
        setMessage(response.ok ? data.message : data.message || 'Unable to save procurement');
        if (response.ok) { setShowModal(false); setEditingId(null); setFormData(emptyForm); fetchRecords(); }
    };

    const edit = (record) => { setEditingId(record.id); setFormData({ ...emptyForm, ...record }); setShowModal(true); };
    const remove = async (id) => { if (!confirm('Delete this procurement record?')) return; const response = await fetch(`/api/admin/procurements/${id}`, { method: 'DELETE' }); if (response.ok) fetchRecords(); };
    const importFile = async (event) => { const file = event.target.files?.[0]; if (!file) return; const body = new FormData(); body.append('file', file); const response = await fetch('/api/admin/procurements/import', { method: 'POST', body }); const data = await response.json(); setMessage(data.message || 'Procurement import completed'); if (response.ok) fetchRecords(); event.target.value = ''; };
    const exportFile = async () => { const response = await fetch('/api/admin/procurements/export'); if (!response.ok) return setMessage('Procurement export failed'); const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = 'procurements_export.xlsx'; link.click(); URL.revokeObjectURL(url); };
    const fields = [['date_procured', 'Date Procured', 'date'], ['car_make', 'Car Maker', 'text'], ['car_model', 'Car Model', 'text'], ['car_year', 'Year', 'text'], ['price_usd', 'Price (USD)', 'number'], ['auction_charge_usd', 'Auction Charge (USD)', 'number'], ['state', 'State', 'text'], ['trucking', 'Trucking', 'number'], ['shipping', 'Shipping', 'text'], ['arrival_date', 'Arrival Date', 'date'], ['profit_ngn', 'Profit (NGN)', 'number'], ['trucking_fee', 'Trucking Fee', 'text']];
    const totalPages = Math.max(1, Math.ceil(records.length / itemsPerPage));
    const paginatedRecords = records.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return <div className="bg-surface-container rounded-xl p-lg border border-white/10">Loading procurements...</div>;
    return <div className="bg-surface-container rounded-xl p-lg border border-white/10">
        {message && <div className="mb-md p-md rounded-lg bg-green-500/20 text-green-400">{message}</div>}
        <div className="flex flex-col md:flex-row gap-md mb-lg md:items-center md:justify-between"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, vehicle, auction..." className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg py-2 px-md text-on-surface" /><div className="flex gap-sm"><label className="bg-surface-container-high border border-outline-variant text-on-surface px-md py-sm rounded-lg font-bold cursor-pointer">Import<input type="file" accept=".xlsx,.xls" onChange={importFile} className="hidden" /></label><button onClick={exportFile} className="bg-surface-container-high border border-outline-variant text-on-surface px-md py-sm rounded-lg font-bold">Export</button><button onClick={() => { setEditingId(null); setFormData(emptyForm); setShowModal(true); }} className="bg-secondary text-on-secondary px-md py-sm rounded-lg font-bold">+ Add Procurement</button></div></div>
        <ServiceFilterBar filters={filters} onChange={setFilters} columnLabel="Auction site" columnPlaceholder="Filter auction site" statusOptions={['pending', 'purchased', 'cancelled', 'on_vessel', 'arrived'].map((value) => ({ value, label: value }))} />
        <div className="overflow-x-auto"><table className="min-w-full border-separate border-spacing-0"><thead><tr className="bg-[#0B3D2E] text-left">{['SN', 'DATE PROCURED', 'CAR MAKER', 'CAR MODEL', 'YEAR', 'PRICE (USD)', 'AUCTION CHARGE (USD)', 'AUCTION SITE', 'STATE', 'TRUCKING', 'SHIPPING', 'ARRIVAL DATE', 'PROFIT (NGN)', 'TRUCKING FEE', 'STATUS', 'Actions'].map((heading) => <th key={heading} className="px-md py-sm font-label-md text-white">{heading}</th>)}</tr></thead><tbody className="text-white">{paginatedRecords.map((record, index) => <tr key={record.id} className="border-b border-outline-variant hover:bg-surface-container-highest"><td className="px-md py-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td><td className="px-md py-sm">{record.date_procured || '—'}</td><td className="px-md py-sm">{record.car_make || '—'}</td><td className="px-md py-sm">{record.car_model || '—'}</td><td className="px-md py-sm">{record.car_year || '—'}</td><td className="px-md py-sm">{record.price_usd || '—'}</td><td className="px-md py-sm">{record.auction_charge_usd || '—'}</td><td className="px-md py-sm">{record.auction_site || '—'}</td><td className="px-md py-sm">{record.state || '—'}</td><td className="px-md py-sm">{record.trucking || '—'}</td><td className="px-md py-sm">{record.shipping || '—'}</td><td className="px-md py-sm">{record.arrival_date || '—'}</td><td className="px-md py-sm">{record.profit_ngn || '—'}</td><td className="px-md py-sm uppercase">{record.trucking_fee || '—'}</td><td className="px-md py-sm uppercase">{record.status || '—'}</td><td className="px-md py-sm"><button onClick={() => edit(record)} className="text-secondary mr-sm">Edit</button><button onClick={() => remove(record.id)} className="text-red-400">Delete</button></td></tr>)}</tbody></table></div>
        <div className="mt-lg flex items-center justify-between"><span className="text-sm text-on-surface-variant">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, records.length)} of {records.length}</span><div className="flex gap-sm"><button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="px-md py-sm rounded-lg border border-outline-variant disabled:opacity-40">Prev</button><span className="px-sm py-sm text-sm text-on-surface-variant">Page {currentPage} of {totalPages}</span><button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="px-md py-sm rounded-lg border border-outline-variant disabled:opacity-40">Next</button></div></div>
        {showModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md"><form onSubmit={submit} className="bg-surface-container rounded-xl border border-outline-variant w-full max-w-4xl max-h-[90vh] overflow-y-auto p-lg space-y-lg"><div className="flex justify-between"><h3 className="text-xl font-bold">{editingId ? 'Edit Procurement' : 'Add Procurement'}</h3><button type="button" onClick={() => setShowModal(false)} className="material-symbols-outlined">close</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-md">{fields.map(([name, label, type]) => <label key={name} className="text-sm text-on-surface-variant">{label}<input type={type} step={type === 'number' ? '0.01' : undefined} value={formData[name] || ''} onChange={(event) => setFormData({ ...formData, [name]: event.target.value })} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" /></label>)}<label className="text-sm text-on-surface-variant">Auction Site<select value={formData.auction_site} onChange={(event) => setFormData({ ...formData, auction_site: event.target.value })} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface">{['copart', 'iaai', 'manheim', 'avc', 'dealership'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-sm text-on-surface-variant">Status<select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface">{['pending', 'purchased', 'cancelled', 'on_vessel', 'arrived'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div><div className="flex justify-end gap-md"><button type="button" onClick={() => setShowModal(false)} className="px-md py-sm rounded-lg border border-outline-variant">Cancel</button><button className="bg-secondary text-on-secondary px-md py-sm rounded-lg font-bold">{editingId ? 'Update' : 'Create'}</button></div></form></div>}
    </div>;
}

export default ProcurementManager;
