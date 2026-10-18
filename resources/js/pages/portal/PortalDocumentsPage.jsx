import React, { useRef, useState } from 'react';
import portalApi from '../../services/portalApi';
import { usePortal } from '../../contexts/PortalContext';
import { Button, Card, Empty, Modal, Notice, PageHeader, Select, Spinner, TextInput, formatDate, titleCase, useAction, useLoad } from '../../components/portal/ui';

const CATEGORIES = [
    ['id', 'ID document'],
    ['power_of_attorney', 'Power of attorney'],
    ['purchase_papers', 'Purchase papers'],
    ['payment_proof', 'Payment proof'],
    ['other', 'Other'],
];

function sizeLabel(bytes) {
    if (!bytes) return '';
    return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function UploadModal({ vehicles, onClose, onDone }) {
    const fileRef = useRef(null);
    const { busy, error, run } = useAction();
    const [form, setForm] = useState({ title: '', category: 'other', record: '' });
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        const file = fileRef.current?.files?.[0];
        if (!file) return;

        const body = new FormData();
        body.append('file', file);
        if (form.title) body.append('title', form.title);
        body.append('category', form.category);
        if (form.record) {
            body.append('record_type', 'shipments');
            body.append('record_id', form.record);
        }

        const result = await run(() => portalApi.upload('/documents', body));
        if (result) onDone();
    };

    return (
        <Modal title="Upload a document" onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                {error && <Notice tone="error">{error}</Notice>}
                <label className="block">
                    <span className="mb-1 block text-sm text-on-surface-variant">File (PDF, image, Word or Excel, up to 10 MB)</span>
                    <input ref={fileRef} type="file" required accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" className="block w-full text-sm text-on-surface" />
                </label>
                <TextInput label="Title (optional)" value={form.title} onChange={set('title')} />
                <Select label="Type" value={form.category} onChange={set('category')}>
                    {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
                <Select label="Attach to a vehicle (optional)" value={form.record} onChange={set('record')}>
                    <option value="">Not attached</option>
                    {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle || vehicle.reference} ({vehicle.reference})</option>)}
                </Select>
                <Button type="submit" disabled={busy} className="w-full">{busy ? 'Uploading…' : 'Upload'}</Button>
            </form>
        </Modal>
    );
}

export default function PortalDocumentsPage() {
    const { can } = usePortal();
    const docs = useLoad(() => portalApi.get('/documents'));
    const vehicles = useLoad(() => portalApi.get('/vehicles'));
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState('all');

    const remove = async (id) => {
        if (!window.confirm('Remove this document?')) return;
        try {
            await portalApi.del(`/documents/${id}`);
            docs.reload();
        } catch (caught) {
            window.alert(caught.message);
        }
    };

    const hrefFor = (item) => {
        if (item.kind === 'invoice') return portalApi.url(`/invoices/${item.id}/download`);
        if (item.kind === 'dock_receipt') return portalApi.url(`/dock-receipts/${item.id}/download`);
        if (item.kind === 'receipt') return portalApi.url(`/receipts/${item.id}/download`);
        return portalApi.url(`/documents/${item.id}/download`);
    };

    const items = (docs.data?.items || []).filter((item) => filter === 'all' || item.kind === filter);

    return (
        <div className="space-y-md">
            <PageHeader
                title="Documents"
                subtitle="Invoices, dock receipts and files shared between you and OD Automotive."
                actions={can('documents') && <Button onClick={() => setUploading(true)}><span className="material-symbols-outlined text-base">upload</span> Upload</Button>}
            />

            <div className="flex flex-wrap gap-2">
                {[['all', 'All'], ['invoice', 'Invoices'], ['receipt', 'Sales receipts'], ['dock_receipt', 'Dock receipts'], ['file', 'Files']].map(([value, label]) => (
                    <button key={value} onClick={() => setFilter(value)} className={`rounded-lg border px-md py-1.5 text-sm ${filter === value ? 'border-secondary bg-secondary text-on-secondary' : 'border-outline-variant text-on-surface'}`}>{label}</button>
                ))}
            </div>

            {docs.loading && <Spinner />}
            {docs.error && <Notice tone="error">{docs.error}</Notice>}
            {docs.data && (items.length === 0 ? <Empty>No documents yet.</Empty> : (
                <Card>
                    <ul className="divide-y divide-white/10">
                        {items.map((item) => (
                            <li key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <div className="truncate font-semibold text-white">{item.title}</div>
                                    <div className="text-xs text-on-surface-variant">{titleCase(item.category)} · {item.source} · {formatDate(item.date)} {sizeLabel(item.size)}</div>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <a href={hrefFor(item)} className="text-sm font-semibold text-secondary hover:underline">Download</a>
                                    {item.kind === 'file' && item.source === 'You' && <button onClick={() => remove(item.id)} className="text-sm text-red-400 hover:underline">Remove</button>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            ))}

            {uploading && (
                <UploadModal vehicles={vehicles.data?.items || []} onClose={() => setUploading(false)} onDone={() => { setUploading(false); docs.reload(); }} />
            )}
        </div>
    );
}
