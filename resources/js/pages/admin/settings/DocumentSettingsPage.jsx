import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { Button, Card, Notice, Spinner, TextInput, useAction } from '../../../components/portal/ui';

const API = '/api/admin/document-signature';

async function request(method, body) {
    const response = await fetch(API, { method, body, headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const fieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
        throw new Error(fieldError || data?.message || data?.error || 'Request failed');
    }
    return data;
}

/** The signature as it will sit on a document: image, a line, then name and title. */
function SignaturePreview({ imageUrl, name, title }) {
    return (
        <div className="rounded-lg bg-white p-md text-slate-900">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">Preview</div>
            <div className="inline-block min-w-[180px]">
                {imageUrl
                    ? <img src={imageUrl} alt="Signature preview" style={{ maxWidth: 170, maxHeight: 52 }} />
                    : <div style={{ height: 20 }} />}
                <div className="mb-1 mt-1 w-24 border-b-2 border-slate-900" />
                <div className="text-sm font-extrabold">{name}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-red-500">/ {title}</div>
            </div>
        </div>
    );
}

function NoAccess() {
    return (
        <div className="space-y-gutter">
            <h1 className="font-display-sm text-display-sm text-white">Documents & Signature</h1>
            <Notice tone="warning">
                You do not have permission to manage the document signature. A super admin can allow it for your account under Admin Users.
            </Notice>
        </div>
    );
}

export default function DocumentSettingsPage() {
    const { canManageSignature } = useAdmin();
    return canManageSignature ? <SignatureManager /> : <NoAccess />;
}

function SignatureManager() {
    const fileRef = useRef(null);
    const load = useAction();
    const save = useAction();
    const remove = useAction();
    const [settings, setSettings] = useState(null);
    const [form, setForm] = useState({ name: '', title: '' });
    const [picked, setPicked] = useState(null);
    const [message, setMessage] = useState('');

    const refresh = async () => {
        const data = await load.run(() => request('GET'));
        if (data) {
            setSettings(data);
            setForm({ name: data.name || '', title: data.title || '' });
        }
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // A local preview of the chosen file, released when it changes.
    const pickedUrl = useMemo(() => (picked ? URL.createObjectURL(picked) : null), [picked]);
    useEffect(() => () => pickedUrl && URL.revokeObjectURL(pickedUrl), [pickedUrl]);

    if (!settings) return load.error ? <Notice tone="error">{load.error}</Notice> : <Spinner />;

    const storedUrl = settings.has_signature ? `${API}/image?v=${encodeURIComponent(settings.updated_at || '')}` : null;
    const shownName = form.name.trim() || settings.default_name;
    const shownTitle = form.title.trim() || settings.default_title;
    const dirty = Boolean(picked) || form.name !== (settings.name || '') || form.title !== (settings.title || '');

    const submit = async (event) => {
        event.preventDefault();
        setMessage('');
        const body = new FormData();
        if (picked) body.append('signature', picked);
        body.append('name', form.name);
        body.append('title', form.title);

        const data = await save.run(() => request('POST', body));
        if (data) {
            setSettings(data);
            setPicked(null);
            if (fileRef.current) fileRef.current.value = '';
            setMessage('Saved. New invoices and dock receipts will use this signature.');
        }
    };

    const removeSignature = async () => {
        if (!window.confirm('Remove the signature image? Documents will show a plain signature line again.')) return;
        setMessage('');
        const data = await remove.run(() => request('DELETE'));
        if (data) {
            setSettings(data);
            setPicked(null);
            setMessage('Signature removed.');
        }
    };

    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Documents & Signature</h1>
                <p className="font-body-lg text-on-surface-variant">
                    The signature below is printed on every invoice and dock receipt, so the two always match.
                </p>
            </div>

            {message && <Notice tone="success">{message}</Notice>}
            {save.error && <Notice tone="error">{save.error}</Notice>}
            {remove.error && <Notice tone="error">{remove.error}</Notice>}

            <form onSubmit={submit} className="grid gap-md lg:grid-cols-2">
                <Card title="Signature image">
                    <div className="space-y-md">
                        <div className="flex min-h-[110px] items-center justify-center rounded-lg border border-dashed border-white/20 bg-white p-md">
                            {pickedUrl || storedUrl
                                ? <img src={pickedUrl || storedUrl} alt="Current signature" style={{ maxWidth: '100%', maxHeight: 90 }} />
                                : <span className="text-sm text-slate-500">No signature uploaded yet</span>}
                        </div>
                        {picked && <p className="text-xs text-on-surface-variant">New file selected: {picked.name}. Click Save to use it.</p>}

                        <label className="block">
                            <span className="mb-1 block text-sm font-medium text-on-surface-variant">{settings.has_signature ? 'Replace signature' : 'Upload signature'}</span>
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                onChange={(event) => setPicked(event.target.files?.[0] || null)}
                                className="block w-full text-sm text-on-surface"
                            />
                            <span className="mt-1 block text-xs text-on-surface-variant/70">
                                PNG with a transparent background looks best. JPG also works. Up to 2 MB; large images are reduced automatically.
                            </span>
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <Button type="submit" disabled={save.busy || !dirty}>{save.busy ? 'Saving…' : 'Save'}</Button>
                            {settings.has_signature && <Button type="button" variant="ghost" disabled={remove.busy} onClick={removeSignature}>Remove image</Button>}
                        </div>
                    </div>
                </Card>

                <div className="space-y-md">
                    <Card title="Printed under the signature">
                        <div className="space-y-3">
                            <TextInput label="Name" value={form.name} placeholder={settings.default_name} onChange={(event) => setForm({ ...form, name: event.target.value })} hint={`Leave empty to print "${settings.default_name}".`} />
                            <TextInput label="Title" value={form.title} placeholder={settings.default_title} onChange={(event) => setForm({ ...form, title: event.target.value })} hint={`Leave empty to print "${settings.default_title}".`} />
                        </div>
                    </Card>
                    <Card title="How it will look">
                        <SignaturePreview imageUrl={pickedUrl || storedUrl} name={shownName} title={shownTitle} />
                        <p className="mt-3 text-xs text-on-surface-variant">
                            Documents are produced on demand, so downloading an older invoice or receipt later also shows the current signature.
                        </p>
                    </Card>
                </div>
            </form>
        </div>
    );
}
