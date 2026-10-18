import React, { useEffect, useRef, useState } from 'react';

const BASE = { admin: '/api/admin/receipts', portal: '/api/portal/receipts' };

// A receipt picked while a record is still being created has nowhere to go until the record exists.
// The form that creates the record calls flushPendingReceipt() with the new id once it is saved.
const pending = {};

export async function uploadReceipt(recordType, recordId, file, scope = 'admin') {
    const body = new FormData();
    body.append('record_type', recordType);
    body.append('record_id', recordId);
    body.append('file', file);

    const response = await fetch(BASE[scope], { method: 'POST', body, headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const fieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
        throw new Error(fieldError || data?.message || 'Receipt upload failed');
    }

    return data;
}

/** Upload the receipt chosen on a "new record" form. Never throws: the record is already saved. */
export async function flushPendingReceipt(recordType, recordId, scope = 'admin') {
    const file = pending[recordType];
    delete pending[recordType];
    if (!file || !recordId) return null;

    try {
        await uploadReceipt(recordType, recordId, file, scope);
        return null;
    } catch (error) {
        return error.message;
    }
}

function formatSize(bytes) {
    if (!bytes) return '';
    return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Optional "vehicle sales receipt" control for any service record.
 * With a recordId it lists, uploads and removes receipts straight away; without one
 * (a record being created) it holds the chosen file until flushPendingReceipt() is called.
 */
export default function SalesReceiptField({ recordType, recordId = null, scope = 'admin', compact = false }) {
    const inputRef = useRef(null);
    const [receipts, setReceipts] = useState([]);
    const [chosen, setChosen] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        if (!recordId) return;
        try {
            const response = await fetch(`${BASE[scope]}?record_type=${recordType}&record_id=${recordId}`, { headers: { Accept: 'application/json' } });
            if (response.ok) setReceipts(await response.json());
        } catch (loadError) {
            setError('Could not load receipts.');
        }
    };

    useEffect(() => {
        delete pending[recordType];
        setChosen(null);
        load();
        return () => { delete pending[recordType]; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recordType, recordId, scope]);

    const onPick = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setError('');

        if (!recordId) {
            pending[recordType] = file;
            setChosen(file);
            return;
        }

        setBusy(true);
        try {
            await uploadReceipt(recordType, recordId, file, scope);
            await load();
        } catch (uploadError) {
            setError(uploadError.message);
        } finally {
            setBusy(false);
        }
    };

    const clearChosen = () => {
        delete pending[recordType];
        setChosen(null);
    };

    const remove = async (id) => {
        if (!window.confirm('Remove this receipt?')) return;
        setError('');
        const response = await fetch(`${BASE[scope]}/${id}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
        if (response.ok) {
            load();
        } else {
            const data = await response.json().catch(() => ({}));
            setError(data.message || 'Could not remove the receipt.');
        }
    };

    return (
        <div className={`rounded-lg border border-outline-variant ${compact ? 'p-sm' : 'p-md'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-on-surface">Vehicle sales receipt <span className="font-normal text-on-surface-variant">(optional)</span></div>
                    <div className="text-xs text-on-surface-variant">PDF or photo, up to 8 MB.</div>
                </div>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                    className="rounded-lg border border-outline-variant px-md py-1.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                >
                    {busy ? 'Uploading…' : recordId ? 'Upload receipt' : chosen ? 'Change file' : 'Choose file'}
                </button>
                <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onPick} className="hidden" />
            </div>

            {error && <div className="mt-2 text-sm text-red-400">{error}</div>}

            {chosen && (
                <div className="mt-2 flex items-center justify-between rounded bg-surface-container-high px-3 py-2 text-sm text-on-surface">
                    <span className="truncate">{chosen.name} <span className="text-xs text-on-surface-variant">({formatSize(chosen.size)}). It is saved with the record.</span></span>
                    <button type="button" onClick={clearChosen} className="ml-3 text-red-400 hover:underline">Remove</button>
                </div>
            )}

            {receipts.length > 0 && (
                <ul className="mt-2 divide-y divide-white/10">
                    {receipts.map((receipt) => (
                        <li key={receipt.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <span className="min-w-0 truncate text-on-surface">
                                {receipt.original_name}
                                <span className="ml-2 text-xs text-on-surface-variant">
                                    {receipt.uploaded_by_type === 'admin' ? 'OD Automotive' : 'Customer'} · {String(receipt.created_at).slice(0, 10)} {formatSize(receipt.size)}
                                </span>
                            </span>
                            <span className="flex shrink-0 gap-3">
                                <a href={`${BASE[scope]}/${receipt.id}/download`} className="text-secondary hover:underline">Download</a>
                                {(scope === 'admin' || receipt.uploaded_by_type === 'customer') && (
                                    <button type="button" onClick={() => remove(receipt.id)} className="text-red-400 hover:underline">Remove</button>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
