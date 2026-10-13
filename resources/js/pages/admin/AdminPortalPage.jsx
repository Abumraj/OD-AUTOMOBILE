import React, { useState } from 'react';
import { Button, Card, Empty, Modal, Notice, Select, Spinner, StatusBadge, TextArea, TextInput, formatDate, formatMoney, titleCase, useAction, useLoad } from '../../components/portal/ui';

const BASE = '/api/admin/portal';

async function call(path, { method = 'GET', body, formData } = {}) {
    const options = { method, headers: { Accept: 'application/json' } };
    if (formData) {
        options.body = formData;
    } else if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${BASE}${path}`, options);
    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }
    if (!response.ok) {
        const fieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
        throw new Error(fieldError || data?.message || data?.error || 'Request failed');
    }
    return data;
}

const api = {
    get: (path) => call(path),
    post: (path, body) => call(path, { method: 'POST', body }),
    put: (path, body) => call(path, { method: 'PUT', body }),
    del: (path) => call(path, { method: 'DELETE' }),
    upload: (path, formData) => call(path, { method: 'POST', formData }),
};

const TABS = [
    ['customers', 'Customers', 'pending_accounts'],
    ['import', 'Import existing clients', null],
    ['payments', 'Payments', 'pending_payments'],
    ['invoices', 'Invoices', null],
    ['requests', 'Requests & quotes', 'quotes_to_price'],
    ['tickets', 'Support', 'open_tickets'],
    ['settings', 'Settings', null],
];

/* ------------------------------------------------------------------ customers */

function CreateCustomerModal({ onClose, onDone }) {
    const { busy, error, run } = useAction();
    const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', phone: '', address: '', credit_terms_days: 0, send_welcome: true });
    const [created, setCreated] = useState(null);
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        const result = await run(() => api.post('/customers', { ...form, credit_terms_days: Number(form.credit_terms_days) || 0 }));
        if (result) setCreated(result);
    };

    if (created) {
        return (
            <Modal title="Account created" onClose={onDone}>
                <Notice tone="success">The portal account is active and linked to {Object.values(created.linked).reduce((sum, count) => sum + count, 0)} existing record(s).</Notice>
                {created.temporary_password && (
                    <div className="mt-3">
                        <div className="text-sm text-on-surface-variant">Temporary password (share it securely):</div>
                        <code className="mt-1 block rounded bg-surface-container-high p-3 text-white">{created.temporary_password}</code>
                    </div>
                )}
                <Button className="mt-md w-full" onClick={onDone}>Done</Button>
            </Modal>
        );
    }

    return (
        <Modal title="Register a customer" onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                {error && <Notice tone="error">{error}</Notice>}
                <TextInput label="Company name" required value={form.company_name} onChange={set('company_name')} />
                <TextInput label="Contact person" required value={form.contact_name} onChange={set('contact_name')} />
                <TextInput label="Email" type="email" required value={form.email} onChange={set('email')} hint="Existing records with this email are linked to the account." />
                <TextInput label="Phone" value={form.phone} onChange={set('phone')} />
                <TextInput label="Address" value={form.address} onChange={set('address')} />
                <TextInput label="Credit terms (days, 0 = pay on issue)" type="number" min="0" value={form.credit_terms_days} onChange={set('credit_terms_days')} />
                <label className="flex items-center gap-2 text-sm text-on-surface">
                    <input type="checkbox" checked={form.send_welcome} onChange={(e) => setForm({ ...form, send_welcome: e.target.checked })} className="accent-secondary" />
                    Email the customer their login details
                </label>
                <Button type="submit" disabled={busy} className="w-full">{busy ? 'Creating…' : 'Create account'}</Button>
            </form>
        </Modal>
    );
}

function CustomerDetail({ id, tiers, onClose, onChanged }) {
    const { data, error, loading, reload } = useLoad(() => api.get(`/customers/${id}`), [id]);
    const action = useAction();
    const [notice, setNotice] = useState('');
    const [form, setForm] = useState(null);
    const [credit, setCredit] = useState({ amount: '', description: '' });
    const [doc, setDoc] = useState({ title: '', record_id: '' });
    const [aliasInput, setAliasInput] = useState({ type: 'name', value: '' });

    React.useEffect(() => {
        if (data && !form) {
            setForm({
                company_name: data.company_name || '', contact_name: data.contact_name || '', phone: data.phone || '', address: data.address || '',
                credit_terms_days: data.credit_terms_days, pricing_tier: data.pricing_tier, discount_percent: data.discount_percent,
                approval_threshold: data.approval_threshold ?? '', admin_notes: data.admin_notes || '',
            });
        }
    }, [data, form]);

    if (loading || !form) return <Modal title="Customer" onClose={onClose}><Spinner /></Modal>;
    if (error) return <Modal title="Customer" onClose={onClose}><Notice tone="error">{error}</Notice></Modal>;

    const done = (text) => { setNotice(text); reload(); onChanged(); };
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

    const save = async () => {
        const payload = { ...form, credit_terms_days: Number(form.credit_terms_days) || 0, discount_percent: Number(form.discount_percent) || 0, approval_threshold: form.approval_threshold === '' ? null : Number(form.approval_threshold) };
        if (await action.run(() => api.put(`/customers/${id}`, payload))) done('Saved.');
    };
    const setStatus = async (status) => {
        const result = await action.run(() => api.post(`/customers/${id}/status`, { status }));
        if (result) {
            const linked = Object.values(result.linked || {}).reduce((sum, count) => sum + count, 0);
            done(`Account is now ${status}.${linked ? ` ${linked} record(s) linked.` : ''}`);
        }
    };
    const link = async () => {
        const result = await action.run(() => api.post(`/customers/${id}/link`));
        if (result) done(`Linked ${Object.values(result.linked).reduce((sum, count) => sum + count, 0)} record(s) by email.`);
    };
    const resetPassword = async () => {
        const result = await action.run(() => api.post(`/customers/${id}/reset-password`, {}));
        if (result) setNotice(`New temporary password for ${result.email}: ${result.temporary_password}`);
    };
    const addCredit = async (event) => {
        event.preventDefault();
        const result = await action.run(() => api.post(`/customers/${id}/credit`, { amount: Number(credit.amount), description: credit.description }));
        if (result) {
            setCredit({ amount: '', description: '' });
            done(`Credit balance is now ${formatMoney(result.credit_balance, 'NGN')}.`);
        }
    };
    const remove = async () => {
        if (!window.confirm('Delete this portal account? Service records and invoices are kept.')) return;
        if (await action.run(() => api.del(`/customers/${id}`))) { onChanged(); onClose(); }
    };
    const upload = async (event) => {
        event.preventDefault();
        const file = event.target.elements.file.files[0];
        if (!file) return;
        const body = new FormData();
        body.append('file', file);
        if (doc.title) body.append('title', doc.title);
        if (doc.record_id) { body.append('record_type', 'shipments'); body.append('record_id', doc.record_id); }
        if (await action.run(() => api.upload(`/customers/${id}/documents`, body))) {
            setDoc({ title: '', record_id: '' });
            event.target.reset();
            done('Document shared with the customer.');
        }
    };
    const removeDoc = async (docId) => {
        if (await action.run(() => api.del(`/documents/${docId}`))) done('Document removed.');
    };

    const addAlias = async (event) => {
        event.preventDefault();
        const value = aliasInput.value.trim();
        if (!value) return;
        const result = await action.run(() => api.post(`/customers/${id}/aliases`, aliasInput.type === 'name' ? { names: [value] } : { emails: [value] }));
        if (result) {
            setAliasInput({ ...aliasInput, value: '' });
            const linkedNow = Object.values(result.linked || {}).reduce((sum, count) => sum + count, 0);
            done(`${result.added ? 'Alias added.' : 'Nothing added.'} ${linkedNow} record(s) linked.${result.skipped.length ? ' ' + result.skipped.join('; ') : ''}`);
        }
    };
    const removeAlias = async (aliasId) => {
        if (await action.run(() => api.del(`/customers/${id}/aliases/${aliasId}`))) done('Alias removed. Records already linked stay linked.');
    };

    const linkable = Object.values(data.linkable || {}).reduce((sum, count) => sum + count, 0);

    return (
        <Modal title={data.company_name} onClose={onClose}>
            <div className="space-y-4">
                {notice && <Notice tone="success">{notice}</Notice>}
                {action.error && <Notice tone="error">{action.error}</Notice>}

                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={data.status} />
                    <span className="text-sm text-on-surface-variant">{data.email} · registered {data.registered_via === 'admin' ? 'by OD' : 'by the customer'} · {formatDate(data.created_at)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {data.status !== 'active' && <Button disabled={action.busy} onClick={() => setStatus('active')}>{data.status === 'pending' ? 'Approve account' : 'Reactivate'}</Button>}
                    {data.status === 'active' && <Button variant="ghost" disabled={action.busy} onClick={() => setStatus('suspended')}>Suspend</Button>}
                    <Button variant="ghost" disabled={action.busy} onClick={resetPassword}>Reset password</Button>
                    <Button variant="danger" disabled={action.busy} onClick={remove}>Delete</Button>
                </div>

                <div className="rounded-lg border border-white/10 p-3 text-sm">
                    <div className="mb-1 font-semibold text-white">Linked records</div>
                    <div className="text-on-surface-variant">
                        {Object.entries(data.linked).filter(([, count]) => count).map(([table, count]) => `${titleCase(table)}: ${count}`).join(' · ') || 'None yet'}
                    </div>
                    {linkable > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <span className="text-amber-300">{linkable} unlinked record(s) match this email.</span>
                            <Button variant="ghost" disabled={action.busy} onClick={link}>Confirm and link</Button>
                        </div>
                    )}
                </div>

                <div className="rounded-lg border border-white/10 p-3 text-sm">
                    <div className="mb-1 font-semibold text-white">Names and emails linked to this account</div>
                    <p className="mb-2 text-xs text-on-surface-variant">Records whose client name or email matches one of these appear in this customer's portal.</p>
                    {data.aliases.length === 0 ? <div className="text-on-surface-variant">Only the account email is used.</div> : (
                        <ul className="mb-2 flex flex-wrap gap-2">
                            {data.aliases.map((alias) => (
                                <li key={alias.id} className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-on-surface">
                                    <span className="text-on-surface-variant">{alias.type}</span> {alias.label}
                                    <button type="button" className="text-red-400" onClick={() => removeAlias(alias.id)} aria-label="Remove">×</button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <form onSubmit={addAlias} className="flex flex-col gap-2 sm:flex-row">
                        <select value={aliasInput.type} onChange={(e) => setAliasInput({ ...aliasInput, type: e.target.value })} className="rounded-lg border border-outline-variant bg-surface-container-high px-2 py-2 text-on-surface">
                            <option value="name">Client name</option><option value="email">Email</option>
                        </select>
                        <input value={aliasInput.value} onChange={(e) => setAliasInput({ ...aliasInput, value: e.target.value })} placeholder={aliasInput.type === 'name' ? 'Exact name as on the records' : 'name@company.com'} className="flex-1 rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface" />
                        <Button type="submit" variant="ghost" disabled={action.busy}>Add and link</Button>
                    </form>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput label="Company name" value={form.company_name} onChange={set('company_name')} />
                    <TextInput label="Contact person" value={form.contact_name} onChange={set('contact_name')} />
                    <TextInput label="Phone" value={form.phone} onChange={set('phone')} />
                    <TextInput label="Address" value={form.address} onChange={set('address')} />
                    <Select label="Pricing tier" value={form.pricing_tier} onChange={set('pricing_tier')}>
                        {tiers.map((tier) => <option key={tier.key} value={tier.key}>{tier.label} ({tier.discount_percent}%)</option>)}
                    </Select>
                    <TextInput label="Discount %" type="number" min="0" max="100" step="0.01" value={form.discount_percent} onChange={set('discount_percent')} />
                    <TextInput label="Credit terms (days)" type="number" min="0" value={form.credit_terms_days} onChange={set('credit_terms_days')} />
                    <TextInput label="Approval threshold" type="number" min="0" step="0.01" value={form.approval_threshold} onChange={set('approval_threshold')} hint="Operations requests at or above this need owner/finance sign-off." />
                </div>
                <TextArea label="Internal notes (never shown to the customer)" rows={2} value={form.admin_notes} onChange={set('admin_notes')} />
                <Button disabled={action.busy} onClick={save}>Save changes</Button>

                <div className="border-t border-white/10 pt-3">
                    <div className="mb-2 font-semibold text-white">Account credit: {formatMoney(data.credit_balance, 'NGN')}</div>
                    <form onSubmit={addCredit} className="grid gap-2 sm:grid-cols-3">
                        <TextInput label="Amount (negative to deduct)" type="number" step="0.01" required value={credit.amount} onChange={(e) => setCredit({ ...credit, amount: e.target.value })} />
                        <TextInput label="Description" value={credit.description} onChange={(e) => setCredit({ ...credit, description: e.target.value })} />
                        <div className="flex items-end"><Button type="submit" disabled={action.busy} className="w-full">Update credit</Button></div>
                    </form>
                </div>

                <div className="border-t border-white/10 pt-3">
                    <div className="mb-2 font-semibold text-white">Team ({data.users.length})</div>
                    <ul className="text-sm text-on-surface-variant">
                        {data.users.map((user) => <li key={user.id}>{user.name} · {user.email} · {titleCase(user.role)}{user.is_active ? '' : ' (inactive)'}</li>)}
                    </ul>
                </div>

                <div className="border-t border-white/10 pt-3">
                    <div className="mb-2 font-semibold text-white">Share a document</div>
                    <form onSubmit={upload} className="space-y-2">
                        <input name="file" type="file" required className="block w-full text-sm text-on-surface" />
                        <div className="grid gap-2 sm:grid-cols-2">
                            <TextInput label="Title" value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
                            <TextInput label="Shipment ID (optional)" type="number" value={doc.record_id} onChange={(e) => setDoc({ ...doc, record_id: e.target.value })} />
                        </div>
                        <Button type="submit" disabled={action.busy}>Upload</Button>
                    </form>
                    {data.documents.length > 0 && (
                        <ul className="mt-3 divide-y divide-white/10 text-sm">
                            {data.documents.map((item) => (
                                <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                                    <span className="text-white">{item.title} <span className="text-xs text-on-surface-variant">· {item.uploaded_by_admin ? `by ${item.uploaded_by_admin}` : 'by customer'}</span></span>
                                    <span className="flex gap-3">
                                        <a className="text-secondary hover:underline" href={`${BASE}/documents/${item.id}/download`}>Download</a>
                                        <button className="text-red-400 hover:underline" onClick={() => removeDoc(item.id)}>Remove</button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Modal>
    );
}

/* ------------------------------------------------------- existing (legacy) clients */

function titleCaseName(value) {
    return String(value || '').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ImportClientModal({ client, customers, onClose, onDone }) {
    const { busy, error, run } = useAction();
    const usableEmails = client.emails.filter((item) => !item.shared);
    const sharedEmails = client.emails.filter((item) => item.shared);
    const [mode, setMode] = useState('new');
    const [target, setTarget] = useState('');
    const [form, setForm] = useState({
        company_name: titleCaseName(client.display),
        contact_name: titleCaseName(client.display),
        email: client.suggested_email || '',
        phone: '',
        credit_terms_days: 0,
        write_back_email: true,
        send_welcome: false,
    });
    const [names, setNames] = useState(() => client.variants.filter((variant) => !variant.taken).map((variant) => variant.name));
    const [extraEmails, setExtraEmails] = useState(() => usableEmails.map((item) => item.email));
    const related = (client.related || []).flatMap((group) => group.variants.filter((variant) => !variant.taken));
    const [result, setResult] = useState(null);
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
    const toggle = (list, setList, value) => setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

    const recordCount = client.total;
    const missingEmail = Math.max(recordCount - client.emails.filter((item) => !item.shared).reduce((sum, item) => sum + item.count, 0), 0);

    const submit = async (event) => {
        event.preventDefault();
        if (names.length === 0 && extraEmails.length === 0) return;

        let response;
        if (mode === 'new') {
            response = await run(() => api.post('/customers', {
                company_name: form.company_name,
                contact_name: form.contact_name,
                email: form.email,
                phone: form.phone || null,
                credit_terms_days: Number(form.credit_terms_days) || 0,
                alias_names: names,
                alias_emails: extraEmails.filter((email) => email !== form.email.toLowerCase()),
                write_back_email: form.write_back_email,
                send_welcome: form.send_welcome,
            }));
        } else {
            response = await run(() => api.post(`/customers/${target}/aliases`, {
                names, emails: extraEmails, write_back_email: form.write_back_email,
            }));
        }
        if (response) setResult(response);
    };

    if (result) {
        const linkedTotal = Object.values(result.linked || {}).reduce((sum, count) => sum + count, 0);
        return (
            <Modal title="Done" onClose={onDone}>
                <div className="space-y-3">
                    <Notice tone="success">{linkedTotal} record(s) linked to the account.</Notice>
                    {Object.keys(result.email_saved_on || {}).length > 0 && (
                        <Notice tone="info">Email saved on: {Object.entries(result.email_saved_on).map(([table, count]) => `${titleCase(table)} (${count})`).join(', ')}</Notice>
                    )}
                    {(result.skipped || []).map((message) => <Notice key={message} tone="warning">{message}</Notice>)}
                    {result.temporary_password && (
                        <div>
                            <div className="text-sm text-on-surface-variant">Temporary password (share it securely):</div>
                            <code className="mt-1 block rounded bg-surface-container-high p-3 text-white">{result.temporary_password}</code>
                        </div>
                    )}
                    <Button className="w-full" onClick={onDone}>Close</Button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal title={`Portal account for ${titleCaseName(client.display)}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                {error && <Notice tone="error">{error}</Notice>}

                <div className="flex gap-2">
                    {[['new', 'Create a new account'], ['existing', 'Add to an existing account']].map(([value, label]) => (
                        <button key={value} type="button" onClick={() => setMode(value)} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === value ? 'border-secondary text-secondary' : 'border-outline-variant text-on-surface'}`}>{label}</button>
                    ))}
                </div>

                <div>
                    <div className="mb-1 text-sm font-semibold text-white">Records to link by name ({recordCount} in total)</div>
                    <ul className="space-y-1">
                        {client.variants.map((variant) => (
                            <li key={variant.value}>
                                <label className={`flex items-center justify-between gap-3 rounded border border-white/10 px-3 py-2 text-sm ${variant.taken ? 'opacity-50' : ''}`}>
                                    <span className="flex items-center gap-2 text-on-surface">
                                        <input type="checkbox" disabled={variant.taken} checked={names.includes(variant.name)} onChange={() => toggle(names, setNames, variant.name)} className="accent-secondary" />
                                        {variant.name}
                                    </span>
                                    <span className="text-xs text-on-surface-variant">{variant.taken ? 'already on another account' : `${variant.count} record(s)`}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-1 text-xs text-on-surface-variant">Untick any spelling that is really a different business.</p>
                </div>

                {related.length > 0 && (
                    <div>
                        <div className="mb-1 text-sm font-semibold text-white">Possibly the same business</div>
                        <ul className="space-y-1">
                            {related.map((variant) => (
                                <li key={variant.value}>
                                    <label className="flex items-center justify-between gap-3 rounded border border-dashed border-white/15 px-3 py-2 text-sm">
                                        <span className="flex items-center gap-2 text-on-surface">
                                            <input type="checkbox" checked={names.includes(variant.name)} onChange={() => toggle(names, setNames, variant.name)} className="accent-secondary" />
                                            {variant.name}
                                        </span>
                                        <span className="text-xs text-on-surface-variant">{variant.count} record(s)</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-1 text-xs text-on-surface-variant">Tick the ones that are the same company so one account covers all of them.</p>
                    </div>
                )}

                {client.generic && <Notice tone="warning">This looks like a generic name (such as walk-in customers), not one business. Linking it is blocked.</Notice>}

                {sharedEmails.length > 0 && (
                    <Notice tone="info">
                        Records use the shared address {sharedEmails.map((item) => item.email).join(', ')}, which belongs to many clients. It is ignored for matching.
                    </Notice>
                )}

                {usableEmails.length > 0 && (
                    <div>
                        <div className="mb-1 text-sm font-semibold text-white">Also link records using these emails</div>
                        {usableEmails.map((item) => (
                            <label key={item.email} className="flex items-center gap-2 text-sm text-on-surface">
                                <input type="checkbox" checked={extraEmails.includes(item.email)} onChange={() => toggle(extraEmails, setExtraEmails, item.email)} className="accent-secondary" />
                                {item.email} <span className="text-xs text-on-surface-variant">({item.count})</span>
                            </label>
                        ))}
                    </div>
                )}

                {mode === 'new' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <TextInput label="Company name" required value={form.company_name} onChange={set('company_name')} />
                        <TextInput label="Contact person" required value={form.contact_name} onChange={set('contact_name')} />
                        <TextInput label="Business email (their login)" type="email" required value={form.email} onChange={set('email')} hint={client.suggested_email ? 'Taken from their records.' : 'Their records have no usable email. Enter the real one.'} />
                        <TextInput label="Phone" value={form.phone} onChange={set('phone')} />
                        <TextInput label="Credit terms (days)" type="number" min="0" value={form.credit_terms_days} onChange={set('credit_terms_days')} />
                    </div>
                ) : (
                    <Select label="Account" required value={target} onChange={(event) => setTarget(event.target.value)}>
                        <option value="">Choose an account…</option>
                        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name} ({customer.email})</option>)}
                    </Select>
                )}

                <label className="flex items-start gap-2 text-sm text-on-surface">
                    <input type="checkbox" checked={form.write_back_email} onChange={(e) => setForm({ ...form, write_back_email: e.target.checked })} className="mt-1 accent-secondary" />
                    <span>
                        Save their email on these records{missingEmail > 0 ? ` (${missingEmail} have none)` : ''}, so shipment emails and receipts reach them.
                        Only empty or shared-address emails are replaced.
                    </span>
                </label>
                {mode === 'new' && (
                    <label className="flex items-center gap-2 text-sm text-on-surface">
                        <input type="checkbox" checked={form.send_welcome} onChange={(e) => setForm({ ...form, send_welcome: e.target.checked })} className="accent-secondary" />
                        Email them their login details
                    </label>
                )}

                <Button type="submit" disabled={busy || client.generic || (names.length === 0 && extraEmails.length === 0) || (mode === 'existing' && !target)} className="w-full">
                    {busy ? 'Working…' : mode === 'new' ? 'Create account and link records' : 'Add to account and link records'}
                </Button>
            </form>
        </Modal>
    );
}

function LegacyClientsTab({ onChanged }) {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [showGeneric, setShowGeneric] = useState(false);
    const [selected, setSelected] = useState(null);
    const list = useLoad(() => api.get(`/legacy-clients?search=${encodeURIComponent(query)}`), [query]);
    const customers = useLoad(() => api.get('/customers'));

    const clients = (list.data?.clients || []).filter((client) => showGeneric || !client.generic);

    return (
        <div className="space-y-md">
            <Notice tone="info">
                These are clients found in OD's existing records that do not have a portal account yet. Records are matched by the exact
                client name, so a business can be linked even when its records have no email. Pick a client, give it a real login email,
                and its history appears in the portal.
            </Notice>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <TextInput label="Search" placeholder="Client name or email" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setQuery(search)} />
                <Button variant="ghost" onClick={() => setQuery(search)}>Search</Button>
                <label className="flex items-center gap-2 pb-2 text-sm text-on-surface">
                    <input type="checkbox" checked={showGeneric} onChange={(e) => setShowGeneric(e.target.checked)} className="accent-secondary" /> Show generic names (walk-in…)
                </label>
            </div>

            {list.loading ? <Spinner /> : list.error ? <Notice tone="error">{list.error}</Notice> : clients.length === 0 ? <Empty>Every client with records already has a portal account.</Empty> : (
                <>
                    <div className="text-sm text-on-surface-variant">{clients.length} client(s), {list.data.unlinked_records} record(s) not yet linked to any account</div>
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-xs uppercase text-on-surface-variant">
                                    <tr><th className="py-2 pr-3">Client</th><th className="pr-3">Name spellings</th><th className="pr-3">Email on records</th><th className="pr-3">Records</th><th /></tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {clients.map((client) => (
                                        <tr key={client.key}>
                                            <td className="py-3 pr-3 font-semibold text-white">{titleCaseName(client.display)}{client.generic && <span className="ml-2 text-xs font-normal text-amber-300">generic</span>}</td>
                                            <td className="pr-3">{client.variants.length > 1 ? `${client.variants.length} spellings` : '1'}</td>
                                            <td className="pr-3">
                                                {client.suggested_email || (client.shared_email_only ? <span className="text-amber-300">shared address only</span> : <span className="text-on-surface-variant">none</span>)}
                                            </td>
                                            <td className="pr-3">
                                                {client.total} <span className="text-xs text-on-surface-variant">({Object.entries(client.tables).map(([table, count]) => `${titleCase(table)} ${count}`).join(', ')})</span>
                                            </td>
                                            <td className="text-right">
                                                <Button variant="ghost" disabled={client.generic} onClick={() => setSelected(client)}>Create account</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {selected && (
                <ImportClientModal
                    client={selected}
                    customers={customers.data || []}
                    onClose={() => setSelected(null)}
                    onDone={() => { setSelected(null); list.reload(); customers.reload(); onChanged(); }}
                />
            )}
        </div>
    );
}

function CustomersTab({ tiers, onChanged }) {
    const [filters, setFilters] = useState({ status: '', search: '' });
    const [query, setQuery] = useState('');
    const list = useLoad(() => api.get(`/customers?status=${filters.status}&search=${encodeURIComponent(query)}`), [filters.status, query]);
    const [openId, setOpenId] = useState(null);
    const [creating, setCreating] = useState(false);

    return (
        <div className="space-y-md">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <TextInput label="Search" placeholder="Company, contact or email" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && setQuery(filters.search)} />
                <Select label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">All</option><option value="pending">Pending approval</option><option value="active">Active</option><option value="suspended">Suspended</option>
                </Select>
                <Button variant="ghost" onClick={() => setQuery(filters.search)}>Search</Button>
                <Button onClick={() => setCreating(true)}>Register customer</Button>
            </div>

            {list.loading ? <Spinner /> : list.error ? <Notice tone="error">{list.error}</Notice> : list.data.length === 0 ? <Empty>No portal customers yet.</Empty> : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-on-surface-variant">
                                <tr><th className="py-2 pr-3">Company</th><th className="pr-3">Email</th><th className="pr-3">Status</th><th className="pr-3">Tier</th><th className="pr-3">Records</th><th>Registered</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {list.data.map((customer) => (
                                    <tr key={customer.id} className="cursor-pointer hover:bg-surface-container-high" onClick={() => setOpenId(customer.id)}>
                                        <td className="py-3 pr-3 font-semibold text-white">{customer.company_name}</td>
                                        <td className="pr-3">{customer.email}</td>
                                        <td className="pr-3"><StatusBadge status={customer.status} /></td>
                                        <td className="pr-3">{titleCase(customer.pricing_tier)}</td>
                                        <td className="pr-3">{customer.linked_records}</td>
                                        <td>{formatDate(customer.created_at)} <span className="text-xs text-on-surface-variant">({customer.registered_via === 'admin' ? 'by OD' : 'self'})</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {creating && <CreateCustomerModal onClose={() => setCreating(false)} onDone={() => { setCreating(false); list.reload(); onChanged(); }} />}
            {openId && <CustomerDetail id={openId} tiers={tiers} onClose={() => setOpenId(null)} onChanged={() => { list.reload(); onChanged(); }} />}
        </div>
    );
}

/* ------------------------------------------------------------------- payments */

function PaymentsTab({ onChanged }) {
    const [status, setStatus] = useState('pending');
    const list = useLoad(() => api.get(`/payments?status=${status}`), [status]);
    const action = useAction();
    const [note, setNote] = useState({});

    const review = async (payment, decision) => {
        if (decision === 'reject' && !note[payment.id]) {
            window.alert('Add a short reason so the customer knows what to fix.');
            return;
        }
        if (await action.run(() => api.post(`/payments/${payment.id}/review`, { decision, note: note[payment.id] }))) {
            list.reload();
            onChanged();
        }
    };

    return (
        <div className="space-y-md">
            <div className="flex flex-wrap gap-2">
                {[['pending', 'Awaiting review'], ['confirmed', 'Confirmed'], ['rejected', 'Rejected'], ['', 'All']].map(([value, label]) => (
                    <button key={value} onClick={() => setStatus(value)} className={`rounded-lg border px-md py-1.5 text-sm ${status === value ? 'border-secondary bg-secondary text-on-secondary' : 'border-outline-variant text-on-surface'}`}>{label}</button>
                ))}
            </div>
            {action.error && <Notice tone="error">{action.error}</Notice>}

            {list.loading ? <Spinner /> : list.data.length === 0 ? <Empty>No payments here.</Empty> : (
                <div className="space-y-3">
                    {list.data.map((payment) => (
                        <Card key={payment.id}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="font-semibold text-white">{payment.company_name || 'Walk-in'} · {payment.invoice_number}</div>
                                    <div className="text-sm text-on-surface-variant">{titleCase(payment.method)} · ref {payment.reference || '—'} · {formatDate(payment.created_at)}</div>
                                    {payment.note && <div className="text-sm text-on-surface-variant">"{payment.note}"</div>}
                                    {payment.has_proof && <a className="text-sm text-secondary hover:underline" href={`${BASE}/payments/${payment.id}/proof`}>View proof of payment</a>}
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-white">{formatMoney(payment.amount, payment.currency)}</div>
                                    <div className="text-xs text-on-surface-variant">Invoice {formatMoney(payment.invoice_amount, payment.currency)}, paid {formatMoney(payment.invoice_paid, payment.currency)}</div>
                                    <StatusBadge status={payment.status} />
                                </div>
                            </div>
                            {payment.status === 'pending' && (
                                <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-end">
                                    <div className="flex-1"><TextInput label="Note to customer (required to reject)" value={note[payment.id] || ''} onChange={(e) => setNote({ ...note, [payment.id]: e.target.value })} /></div>
                                    <Button disabled={action.busy} onClick={() => review(payment, 'confirm')}>Confirm</Button>
                                    <Button variant="danger" disabled={action.busy} onClick={() => review(payment, 'reject')}>Reject</Button>
                                </div>
                            )}
                            {payment.status !== 'pending' && payment.reviewed_by && <div className="mt-2 text-xs text-on-surface-variant">Reviewed by {payment.reviewed_by} · {formatDate(payment.reviewed_at)}{payment.review_note ? ` · ${payment.review_note}` : ''}</div>}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------- invoices */

function RecordPaymentModal({ invoice, onClose, onDone }) {
    const { busy, error, run } = useAction();
    const [form, setForm] = useState({ method: 'bank_transfer', amount: String(Math.max(Number(invoice.amount) - Number(invoice.amount_paid), 0)), reference: '' });
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        if (await run(() => api.post(`/invoices/${invoice.id}/payments`, { ...form, amount: Number(form.amount) }))) onDone();
    };

    return (
        <Modal title={`Record payment · ${invoice.invoice_number}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                {error && <Notice tone="error">{error}</Notice>}
                <Select label="Received by" value={form.method} onChange={set('method')}>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="swift_wire">International wire</option>
                    <option value="usdt">USDT</option>
                    <option value="cash_pos">Cash / POS at office</option>
                </Select>
                <TextInput label="Amount received" type="number" step="0.01" min="0.01" required value={form.amount} onChange={set('amount')} />
                <TextInput label="Reference" value={form.reference} onChange={set('reference')} />
                <Button type="submit" disabled={busy} className="w-full">Record payment</Button>
            </form>
        </Modal>
    );
}

function InvoicesTab({ onChanged }) {
    const [status, setStatus] = useState('');
    const list = useLoad(() => api.get(`/invoices?status=${status}`), [status]);
    const action = useAction();
    const [recording, setRecording] = useState(null);

    const patch = async (invoice, body) => {
        if (await action.run(() => api.put(`/invoices/${invoice.id}`, body))) { list.reload(); onChanged(); }
    };

    return (
        <div className="space-y-md">
            <div className="flex flex-wrap gap-2">
                {[['', 'All'], ['unpaid', 'Unpaid'], ['partial', 'Part paid'], ['paid', 'Paid'], ['void', 'Void']].map(([value, label]) => (
                    <button key={value} onClick={() => setStatus(value)} className={`rounded-lg border px-md py-1.5 text-sm ${status === value ? 'border-secondary bg-secondary text-on-secondary' : 'border-outline-variant text-on-surface'}`}>{label}</button>
                ))}
            </div>
            {action.error && <Notice tone="error">{action.error}</Notice>}

            {list.loading ? <Spinner /> : list.data.length === 0 ? <Empty>No invoices.</Empty> : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase text-on-surface-variant">
                                <tr><th className="py-2 pr-3">Invoice</th><th className="pr-3">Customer</th><th className="pr-3">Service</th><th className="pr-3 text-right">Amount</th><th className="pr-3 text-right">Paid</th><th className="pr-3">Status</th><th className="pr-3">Due</th><th /></tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {list.data.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td className="py-3 pr-3 font-semibold text-white">{invoice.invoice_number}</td>
                                        <td className="pr-3">{invoice.company_name || invoice.customer_name || '—'}{!invoice.customer_id && <span className="ml-1 text-xs text-amber-300">(no portal account)</span>}</td>
                                        <td className="pr-3">{invoice.service_label}</td>
                                        <td className="pr-3 text-right">{formatMoney(invoice.amount, invoice.currency)}</td>
                                        <td className="pr-3 text-right">{formatMoney(invoice.amount_paid, invoice.currency)}</td>
                                        <td className="pr-3"><StatusBadge status={invoice.status} /></td>
                                        <td className="pr-3">{formatDate(invoice.due_date)}</td>
                                        <td className="space-x-3 whitespace-nowrap text-right">
                                            {['unpaid', 'partial'].includes(invoice.status) && <button className="text-secondary hover:underline" onClick={() => setRecording(invoice)}>Record payment</button>}
                                            {invoice.status !== 'void' && invoice.status !== 'paid' && <button className="text-red-400 hover:underline" onClick={() => window.confirm('Void this invoice?') && patch(invoice, { status: 'void' })}>Void</button>}
                                            {invoice.status === 'void' && <button className="text-secondary hover:underline" onClick={() => patch(invoice, { status: 'unpaid' })}>Restore</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {recording && <RecordPaymentModal invoice={recording} onClose={() => setRecording(null)} onDone={() => { setRecording(null); list.reload(); onChanged(); }} />}
        </div>
    );
}

/* --------------------------------------------------------------------- requests */

function PriceQuoteModal({ quote, onClose, onDone }) {
    const { busy, error, run } = useAction();
    const [form, setForm] = useState({ quoted_amount: quote.quoted_amount ?? '', quote_notes: quote.quote_notes || '' });

    const submit = async (event) => {
        event.preventDefault();
        if (await run(() => api.post(`/quotes/${quote.id}/price`, { quoted_amount: Number(form.quoted_amount), quote_notes: form.quote_notes }))) onDone();
    };

    return (
        <Modal title={`Price quote #${quote.id}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                {error && <Notice tone="error">{error}</Notice>}
                <div className="text-sm text-on-surface-variant">{quote.company_name} · {quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model} · {quote.origin} → {quote.destination}</div>
                <TextInput label="Quoted amount (USD)" type="number" step="0.01" min="0" required value={form.quoted_amount} onChange={(e) => setForm({ ...form, quoted_amount: e.target.value })} />
                <TextArea label="Notes for the customer" rows={3} value={form.quote_notes} onChange={(e) => setForm({ ...form, quote_notes: e.target.value })} />
                <Button type="submit" disabled={busy} className="w-full">Send quote to customer</Button>
            </form>
        </Modal>
    );
}

function RequestsTab({ onChanged }) {
    const list = useLoad(() => api.get('/requests'));
    const [pricing, setPricing] = useState(null);

    if (list.loading) return <Spinner />;
    if (list.error) return <Notice tone="error">{list.error}</Notice>;

    return (
        <div className="space-y-md">
            <Card title="Portal quotes">
                {list.data.quotes.length === 0 ? <Empty>No portal quotes yet.</Empty> : (
                    <ul className="divide-y divide-white/10">
                        {list.data.quotes.map((quote) => (
                            <li key={quote.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="font-semibold text-white">{quote.company_name} · {quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model}</div>
                                    <div className="text-sm text-on-surface-variant">{quote.service} · {quote.origin} → {quote.destination} · {formatDate(quote.created_at)}</div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {quote.quoted_amount !== null && <span className="font-semibold text-white">{formatMoney(quote.quoted_amount, 'USD')}</span>}
                                    {quote.customer_response && <StatusBadge status={quote.customer_response} />}
                                    <StatusBadge status={quote.status} />
                                    {quote.status === 'pending' && !quote.customer_response && <Button variant="ghost" onClick={() => setPricing(quote)}>{quote.quoted_amount === null ? 'Set price' : 'Update price'}</Button>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="mt-3 text-xs text-on-surface-variant">When a customer accepts a priced quote it converts to a shipment automatically. Quotes can also be handled from the main Quotes page.</p>
            </Card>

            <Card title="Requests awaiting customer approval">
                {list.data.requests.length === 0 ? <Empty>No portal requests.</Empty> : (
                    <ul className="divide-y divide-white/10">
                        {list.data.requests.map((request) => (
                            <li key={request.id} className="flex items-center justify-between gap-3 py-3">
                                <div>
                                    <div className="font-semibold text-white">{request.company_name} · {titleCase(request.type)}</div>
                                    <div className="text-sm text-on-surface-variant">{request.payload.vehicle_year} {request.payload.vehicle_make} {request.payload.vehicle_model} · {formatDate(request.created_at)}</div>
                                </div>
                                <StatusBadge status={request.status} />
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {pricing && <PriceQuoteModal quote={pricing} onClose={() => setPricing(null)} onDone={() => { setPricing(null); list.reload(); onChanged(); }} />}
        </div>
    );
}

/* ---------------------------------------------------------------------- tickets */

function TicketModal({ id, onClose, onChanged }) {
    const { data, error, loading, reload } = useLoad(() => api.get(`/tickets/${id}`), [id]);
    const action = useAction();
    const [body, setBody] = useState('');

    if (loading) return <Modal title="Ticket" onClose={onClose}><Spinner /></Modal>;
    if (error) return <Modal title="Ticket" onClose={onClose}><Notice tone="error">{error}</Notice></Modal>;

    const reply = async (close) => {
        if (await action.run(() => api.post(`/tickets/${id}/reply`, { body, close }))) {
            setBody('');
            reload();
            onChanged();
        }
    };

    return (
        <Modal title={`${data.ticket.ticket_number} · ${data.ticket.subject}`} onClose={onClose}>
            <div className="space-y-3">
                <div className="text-sm text-on-surface-variant">{data.company_name}{data.ticket.record_type ? ` · linked to ${data.ticket.record_type} #${data.ticket.record_id}` : ''}</div>
                {data.messages.map((message) => (
                    <div key={message.id} className={`rounded-lg border p-3 ${message.sender_type === 'admin' ? 'border-secondary/30 bg-secondary/10' : 'border-white/10 bg-surface-container-high'}`}>
                        <div className="mb-1 text-xs text-on-surface-variant">{message.sender_name} · {formatDate(message.created_at)}</div>
                        <div className="whitespace-pre-wrap text-white">{message.body}</div>
                    </div>
                ))}
                {action.error && <Notice tone="error">{action.error}</Notice>}
                <TextArea label="Reply" value={body} onChange={(e) => setBody(e.target.value)} />
                <div className="flex gap-2">
                    <Button disabled={action.busy || !body.trim()} onClick={() => reply(false)}>Send reply</Button>
                    <Button variant="ghost" disabled={action.busy || !body.trim()} onClick={() => reply(true)}>Reply and close</Button>
                </div>
            </div>
        </Modal>
    );
}

function TicketsTab({ onChanged }) {
    const [status, setStatus] = useState('open');
    const list = useLoad(() => api.get(`/tickets?status=${status}`), [status]);
    const [openId, setOpenId] = useState(null);

    return (
        <div className="space-y-md">
            <div className="flex flex-wrap gap-2">
                {[['open', 'Needs reply'], ['answered', 'Answered'], ['closed', 'Closed'], ['', 'All']].map(([value, label]) => (
                    <button key={value} onClick={() => setStatus(value)} className={`rounded-lg border px-md py-1.5 text-sm ${status === value ? 'border-secondary bg-secondary text-on-secondary' : 'border-outline-variant text-on-surface'}`}>{label}</button>
                ))}
            </div>
            {list.loading ? <Spinner /> : list.data.length === 0 ? <Empty>No tickets.</Empty> : (
                <Card>
                    <ul className="divide-y divide-white/10">
                        {list.data.map((ticket) => (
                            <li key={ticket.id}>
                                <button onClick={() => setOpenId(ticket.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-surface-container-high">
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold text-white">{ticket.subject}</div>
                                        <div className="text-xs text-on-surface-variant">{ticket.company_name} · {ticket.ticket_number} · {formatDate(ticket.last_message_at)}</div>
                                    </div>
                                    <StatusBadge status={ticket.status} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
            {openId && <TicketModal id={openId} onClose={() => setOpenId(null)} onChanged={() => { list.reload(); onChanged(); }} />}
        </div>
    );
}

/* --------------------------------------------------------------------- settings */

const MODES = [
    ['open', 'Open registration', 'Anyone can register and gets access straight away. Their history is linked only after you confirm the account.'],
    ['approval', 'Registration with approval', 'Businesses register, but cannot sign in until you approve them.'],
    ['admin_only', 'OD registers customers only', 'Self-registration is closed. You create every account.'],
];

const SERVICES = [['quote', 'Shipping quote'], ['auction', 'Auction purchase'], ['trucking', 'Trucking'], ['clearance', 'Clearance']];

function SettingsTab() {
    const { data, error, loading, reload } = useLoad(() => api.get('/settings'));
    const action = useAction();
    const [form, setForm] = useState(null);
    const [saved, setSaved] = useState('');

    React.useEffect(() => {
        if (data) setForm({ ...data, payment_methods: data.payment_methods.map((method) => ({ ...method })), tiers: data.tiers.map((tier) => ({ ...tier })) });
    }, [data]);

    if (loading || !form) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    const updateMethod = (key, patch) => setForm({ ...form, payment_methods: form.payment_methods.map((method) => (method.key === key ? { ...method, ...patch } : method)) });
    const updateTier = (index, patch) => setForm({ ...form, tiers: form.tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)) });
    const toggleService = (service) => setForm({
        ...form,
        requestable_services: form.requestable_services.includes(service) ? form.requestable_services.filter((item) => item !== service) : [...form.requestable_services, service],
    });

    const save = async () => {
        const payload = {
            enabled: form.enabled,
            registration_mode: form.registration_mode,
            bank_details: form.bank_details,
            currency: form.currency,
            requestable_services: form.requestable_services,
            tiers: form.tiers.map((tier) => ({ ...tier, discount_percent: Number(tier.discount_percent) || 0 })),
            payment_methods: form.payment_methods.map((method) => ({ key: method.key, enabled: Boolean(method.enabled), instructions: method.instructions ?? '' })),
        };
        if (await action.run(() => api.put('/settings', payload))) {
            setSaved('Settings saved.');
            reload();
        }
    };

    const gateways = form.payment_methods.filter((method) => method.kind === 'gateway');
    const others = form.payment_methods.filter((method) => method.kind !== 'gateway');

    return (
        <div className="space-y-md">
            {saved && <Notice tone="success">{saved}</Notice>}
            {action.error && <Notice tone="error">{action.error}</Notice>}

            <Card title="Portal access">
                <label className="mb-4 flex items-center gap-3 text-on-surface">
                    <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-5 w-5 accent-secondary" />
                    <span><strong className="text-white">Customer portal is on.</strong> Switch off to lock every customer out, for maintenance.</span>
                </label>
                <div className="space-y-2">
                    {MODES.map(([value, label, hint]) => (
                        <label key={value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${form.registration_mode === value ? 'border-secondary bg-secondary/10' : 'border-white/10'}`}>
                            <input type="radio" name="mode" checked={form.registration_mode === value} onChange={() => setForm({ ...form, registration_mode: value })} className="mt-1 accent-secondary" />
                            <span><span className="block font-semibold text-white">{label}</span><span className="text-sm text-on-surface-variant">{hint}</span></span>
                        </label>
                    ))}
                </div>
            </Card>

            <Card title="What customers can request online">
                <div className="flex flex-wrap gap-4">
                    {SERVICES.map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 text-on-surface">
                            <input type="checkbox" checked={form.requestable_services.includes(value)} onChange={() => toggleService(value)} className="accent-secondary" /> {label}
                        </label>
                    ))}
                </div>
            </Card>

            <Card title="Payment methods">
                <div className="space-y-3">
                    {others.map((method) => (
                        <div key={method.key} className="rounded-lg border border-white/10 p-3">
                            <label className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-white">{method.label}
                                    <span className="ml-2 text-xs font-normal text-on-surface-variant">{method.kind === 'manual' ? 'Customer pays, you confirm' : method.kind === 'credit' ? 'Uses the customer\'s deposit balance' : 'Due date from the customer\'s credit terms'}</span>
                                </span>
                                <input type="checkbox" checked={Boolean(method.enabled)} onChange={(e) => updateMethod(method.key, { enabled: e.target.checked })} className="h-5 w-5 accent-secondary" />
                            </label>
                            {method.kind === 'manual' && method.enabled && (
                                <TextArea label="Instructions shown to the customer (account number, wallet address, office address…)" rows={2} value={method.instructions || ''} onChange={(e) => updateMethod(method.key, { instructions: e.target.value })} />
                            )}
                        </div>
                    ))}
                </div>
                <TextArea label="Default bank details (shown when a method has no instructions of its own)" rows={3} value={form.bank_details || ''} onChange={(e) => setForm({ ...form, bank_details: e.target.value })} />
                <div className="mt-3">
                    <h3 className="mb-2 text-sm font-semibold uppercase text-on-surface-variant">Online gateways (integration pending)</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {gateways.map((method) => (
                            <div key={method.key} className="flex items-center justify-between rounded-lg border border-dashed border-white/15 px-3 py-2 text-on-surface-variant">
                                <span>{method.label}</span><span className="text-xs">Not yet available</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card title="Pricing tiers">
                <div className="space-y-2">
                    {form.tiers.map((tier, index) => (
                        <div key={tier.key} className="grid gap-2 sm:grid-cols-3">
                            <TextInput label="Key" value={tier.key} disabled />
                            <TextInput label="Label" value={tier.label} onChange={(e) => updateTier(index, { label: e.target.value })} />
                            <TextInput label="Discount %" type="number" min="0" max="100" step="0.01" value={tier.discount_percent} onChange={(e) => updateTier(index, { discount_percent: e.target.value })} />
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="Currency">
                <div className="max-w-xs"><TextInput label="Default currency (3 letters)" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
            </Card>

            <Button disabled={action.busy} onClick={save}>{action.busy ? 'Saving…' : 'Save settings'}</Button>
        </div>
    );
}

/* ------------------------------------------------------------------------ page */

export default function AdminPortalPage() {
    const [tab, setTab] = useState('customers');
    const summary = useLoad(() => api.get('/summary'));
    const settings = useLoad(() => api.get('/settings'));
    const tiers = settings.data?.tiers || [{ key: 'standard', label: 'Standard', discount_percent: 0 }];

    return (
        <div className="space-y-md">
            <div>
                <h1 className="text-2xl font-bold text-white">Customer Portal</h1>
                <p className="text-on-surface-variant">Manage business accounts, payments, quotes and support for the customer dashboard.</p>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                {TABS.map(([key, label, badgeKey]) => {
                    const count = badgeKey ? summary.data?.[badgeKey] : 0;
                    return (
                        <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 rounded-lg px-md py-2 text-sm font-semibold ${tab === key ? 'bg-secondary text-on-secondary' : 'text-on-surface hover:bg-surface-container-high'}`}>
                            {label}
                            {count > 0 && <span className="rounded-full bg-red-500 px-2 text-xs text-white">{count}</span>}
                        </button>
                    );
                })}
            </div>

            {tab === 'customers' && <CustomersTab tiers={tiers} onChanged={summary.reload} />}
            {tab === 'import' && <LegacyClientsTab onChanged={summary.reload} />}
            {tab === 'payments' && <PaymentsTab onChanged={summary.reload} />}
            {tab === 'invoices' && <InvoicesTab onChanged={summary.reload} />}
            {tab === 'requests' && <RequestsTab onChanged={summary.reload} />}
            {tab === 'tickets' && <TicketsTab onChanged={summary.reload} />}
            {tab === 'settings' && <SettingsTab />}
        </div>
    );
}
