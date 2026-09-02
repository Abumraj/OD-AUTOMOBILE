import React, { useEffect, useState } from 'react';

const emptyForm = {
    customer_name: '', customer_email: '', sale_date: '', car_make: '', car_model: '', car_year: '', sale_type: 'outright',
    color: '', vin: '', amount: '', profit: '', notes: '', admin_notes: '', is_active: true,
};

function AutosalesManager() {
    const [records, setRecords] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState('');

    const fetchRecords = async () => {
        try {
            const response = await fetch(`/api/admin/autosales?search=${encodeURIComponent(search)}&sort_by=sale_date&sort_order=desc`);
            const data = await response.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            setMessage('Failed to load autosales');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchRecords, 200);
        return () => clearTimeout(timer);
    }, [search]);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            const response = await fetch(editingId ? `/api/admin/autosales/${editingId}` : '/api/admin/autosales', {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Unable to save autosale');
            setMessage(data.message);
            setShowModal(false);
            setEditingId(null);
            setFormData(emptyForm);
            fetchRecords();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };

    const edit = (record) => {
        setEditingId(record.id);
        setFormData({ ...emptyForm, ...record });
        setShowModal(true);
    };

    const remove = async (id) => {
        if (!confirm('Delete this autosale record?')) return;
        const response = await fetch(`/api/admin/autosales/${id}`, { method: 'DELETE' });
        if (response.ok) fetchRecords();
        else setMessage('Failed to delete autosale');
    };

    const importFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/admin/autosales/import', { method: 'POST', body });
        const data = await response.json();
        setMessage(data.message || 'Autosales import completed');
        if (response.ok) fetchRecords();
        event.target.value = '';
    };

    const exportFile = async () => {
        const response = await fetch('/api/admin/autosales/export');
        if (!response.ok) return setMessage('Autosales export failed');
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a');
        link.href = url;
        link.download = 'autosales_export.xlsx';
        link.click();
        URL.revokeObjectURL(url);
    };

    const openNew = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    if (loading) return <div className="bg-surface-container rounded-xl p-lg border border-white/10">Loading autosales...</div>;

    return (
        <div className="bg-surface-container rounded-xl p-lg border border-white/10">
            {message && <div className="mb-md p-md rounded-lg bg-green-500/20 text-green-400">{message}</div>}
            <div className="flex flex-col md:flex-row gap-md mb-lg md:items-center md:justify-between">
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search make, model, VIN, sale type..." className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg py-2 px-md text-on-surface" />
                <div className="flex gap-sm">
                    <label className="bg-surface-container-high border border-outline-variant text-on-surface px-md py-sm rounded-lg font-bold cursor-pointer">Import<input type="file" accept=".xlsx,.xls" onChange={importFile} className="hidden" /></label>
                    <button type="button" onClick={exportFile} className="bg-surface-container-high border border-outline-variant text-on-surface px-md py-sm rounded-lg font-bold">Export</button>
                    <button type="button" onClick={openNew} className="bg-secondary text-on-secondary px-md py-sm rounded-lg font-bold">+ Add Autosale</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead><tr className="bg-[#0B3D2E] text-left">{['SN', 'DATE', 'CAR MAKER', 'CAR MODEL', 'YEAR', 'SALE/TYPE', 'COLOR', 'VIN', 'AMOUNT', 'PROFIT', 'Actions'].map((heading) => <th key={heading} className="px-md py-sm font-label-md text-white">{heading}</th>)}</tr></thead>
                    <tbody className="text-white">{records.map((record, index) => <tr key={record.id} className="border-b border-outline-variant hover:bg-surface-container-highest">
                        <td className="px-md py-sm">{index + 1}</td><td className="px-md py-sm">{record.sale_date || '—'}</td><td className="px-md py-sm">{record.car_make || '—'}</td><td className="px-md py-sm">{record.car_model || '—'}</td><td className="px-md py-sm">{record.car_year || '—'}</td><td className="px-md py-sm uppercase">{record.sale_type}</td><td className="px-md py-sm">{record.color || '—'}</td><td className="px-md py-sm">{record.vin || '—'}</td><td className="px-md py-sm">{record.amount || '—'}</td><td className="px-md py-sm">{record.profit || '—'}</td><td className="px-md py-sm"><button onClick={() => edit(record)} className="text-secondary mr-sm">Edit</button><button onClick={() => remove(record.id)} className="text-red-400">Delete</button></td>
                    </tr>)}</tbody>
                </table>
            </div>
            {showModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md"><form onSubmit={submit} className="bg-surface-container rounded-xl border border-outline-variant w-full max-w-3xl p-lg space-y-lg">
                <div className="flex justify-between"><h3 className="text-xl font-bold">{editingId ? 'Edit Autosale' : 'Add Autosale'}</h3><button type="button" onClick={() => setShowModal(false)} className="material-symbols-outlined">close</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">{[['customer_name', 'Customer Name', 'text'], ['customer_email', 'Customer Email', 'email'], ['sale_date', 'Date', 'date'], ['car_make', 'Car Maker', 'text'], ['car_model', 'Car Model', 'text'], ['car_year', 'Year', 'text'], ['color', 'Color', 'text'], ['vin', 'VIN', 'text'], ['amount', 'Amount', 'number'], ['profit', 'Profit', 'number']].map(([name, label, type]) => <label key={name} className="text-sm text-on-surface-variant">{label}<input type={type} step={type === 'number' ? '0.01' : undefined} value={formData[name] || ''} onChange={(event) => setFormData({ ...formData, [name]: event.target.value })} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface" /></label>)}<label className="text-sm text-on-surface-variant">Sale/Type<select value={formData.sale_type} onChange={(event) => setFormData({ ...formData, sale_type: event.target.value })} className="w-full mt-xs rounded-lg border border-outline-variant bg-surface-container-high px-md py-sm text-on-surface"><option value="outright">Outright</option><option value="swap">Swap</option></select></label></div>
                <div className="flex justify-end gap-md"><button type="button" onClick={() => setShowModal(false)} className="px-md py-sm rounded-lg border border-outline-variant">Cancel</button><button disabled={saving} className="bg-secondary text-on-secondary px-md py-sm rounded-lg font-bold">{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button></div>
            </form></div>}
        </div>
    );
}

export default AutosalesManager;
