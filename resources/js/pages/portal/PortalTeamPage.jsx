import React, { useState } from 'react';
import portalApi from '../../services/portalApi';
import { Button, Card, Modal, Notice, PageHeader, Select, Spinner, StatusBadge, TextInput, formatDate, titleCase, useAction, useLoad } from '../../components/portal/ui';

const ROLES = [
    ['owner', 'Owner: full access, manages team and API'],
    ['finance', 'Finance: payments, approvals, invoices'],
    ['operations', 'Operations: requests, documents, support'],
];

function AddMember({ onClose, onDone }) {
    const { busy, error, run } = useAction();
    const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'operations', password: '' });
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        const result = await run(() => portalApi.post('/team', form));
        if (result) onDone();
    };

    return (
        <Modal title="Add a team member" onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                {error && <Notice tone="error">{error}</Notice>}
                <TextInput label="Name" required value={form.name} onChange={set('name')} />
                <TextInput label="Email" type="email" required value={form.email} onChange={set('email')} />
                <TextInput label="Phone" value={form.phone} onChange={set('phone')} />
                <Select label="Role" value={form.role} onChange={set('role')}>
                    {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
                <TextInput label="Temporary password" type="password" required minLength={8} value={form.password} onChange={set('password')} hint="Share it with them securely. They can change it in Settings." />
                <Button type="submit" disabled={busy} className="w-full">{busy ? 'Adding…' : 'Add member'}</Button>
            </form>
        </Modal>
    );
}

export default function PortalTeamPage() {
    const { data, error, loading, reload } = useLoad(() => portalApi.get('/team'));
    const action = useAction();
    const [adding, setAdding] = useState(false);

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    const update = async (member, patch) => {
        await action.run(() => portalApi.put(`/team/${member.id}`, patch));
        reload();
    };

    const remove = async (member) => {
        if (!window.confirm(`Remove ${member.name} from your team?`)) return;
        await action.run(() => portalApi.del(`/team/${member.id}`));
        reload();
    };

    return (
        <div className="space-y-md">
            <PageHeader title="Team" subtitle="Who can sign in for your business, and what they can do." actions={<Button onClick={() => setAdding(true)}>Add member</Button>} />
            {action.error && <Notice tone="error">{action.error}</Notice>}

            <Card>
                <ul className="divide-y divide-white/10">
                    {data.map((member) => (
                        <li key={member.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 font-semibold text-white">{member.name} {!member.is_active && <StatusBadge status="suspended" />}</div>
                                <div className="text-sm text-on-surface-variant">{member.email}{member.phone ? ` · ${member.phone}` : ''}</div>
                                <div className="text-xs text-on-surface-variant/70">{member.last_login_at ? `Last sign-in ${formatDate(member.last_login_at)}` : 'Never signed in'}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <select value={member.role} onChange={(event) => update(member, { role: event.target.value })} className="rounded-lg border border-outline-variant bg-surface-container-high px-2 py-1.5 text-sm text-on-surface">
                                    {ROLES.map(([value]) => <option key={value} value={value}>{titleCase(value)}</option>)}
                                </select>
                                <Button variant="ghost" onClick={() => update(member, { is_active: !member.is_active })}>{member.is_active ? 'Deactivate' : 'Activate'}</Button>
                                <Button variant="ghost" onClick={() => remove(member)}>Remove</Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card title="Roles">
                <ul className="space-y-1 text-sm text-on-surface-variant">
                    {ROLES.map(([value, label]) => <li key={value}>{label}</li>)}
                </ul>
            </Card>

            {adding && <AddMember onClose={() => setAdding(false)} onDone={() => { setAdding(false); reload(); }} />}
        </div>
    );
}
