import React, { useState } from 'react';
import portalApi from '../../services/portalApi';
import { usePortal } from '../../contexts/PortalContext';
import { Button, Card, Notice, PageHeader, TextInput, useAction } from '../../components/portal/ui';

const CHANNELS = [
    ['email', 'Email'],
    ['sms', 'SMS'],
    ['whatsapp', 'WhatsApp'],
];

const CATEGORIES = [
    ['shipment_updates', 'Shipment and service updates'],
    ['payment_updates', 'Payments and account credit'],
    ['ticket_updates', 'Support replies and account notices'],
];

function Toggle({ checked, onChange, disabled, label }) {
    return (
        <label className={`flex items-center justify-between gap-3 py-2 ${disabled ? 'opacity-60' : ''}`}>
            <span className="text-on-surface">{label}</span>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-secondary" />
        </label>
    );
}

export default function PortalSettingsPage() {
    const { user, customer, refresh } = usePortal();
    const isOwner = user.role === 'owner';
    const canEditPrefs = ['owner', 'finance'].includes(user.role);

    const profile = useAction();
    const password = useAction();
    const prefs = useAction();
    const token = useAction();
    const [saved, setSaved] = useState('');
    const [profileForm, setProfileForm] = useState({
        name: user.name || '',
        phone: user.phone || '',
        company_name: customer.company_name || '',
        contact_name: customer.contact_name || '',
        address: customer.address || '',
    });
    const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [notificationPrefs, setNotificationPrefs] = useState(customer.notification_prefs);
    const [newToken, setNewToken] = useState('');

    const saveProfile = async (event) => {
        event.preventDefault();
        const payload = { name: profileForm.name, phone: profileForm.phone };
        if (isOwner) Object.assign(payload, { company_name: profileForm.company_name, contact_name: profileForm.contact_name, address: profileForm.address });
        const result = await profile.run(() => portalApi.put('/profile', payload));
        if (result) {
            setSaved('Profile saved.');
            refresh();
        }
    };

    const savePassword = async (event) => {
        event.preventDefault();
        const result = await password.run(() => portalApi.put('/password', passwordForm));
        if (result) {
            setSaved(result.message);
            setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
        }
    };

    const savePrefs = async () => {
        const result = await prefs.run(() => portalApi.put('/notification-preferences', notificationPrefs));
        if (result) {
            setSaved('Notification preferences saved.');
            refresh();
        }
    };

    const createToken = async () => {
        const result = await token.run(() => portalApi.post('/api-token'));
        if (result) {
            setNewToken(result.token);
            refresh();
        }
    };

    const revokeToken = async () => {
        if (!window.confirm('Revoke API access? Any integration using the token will stop working.')) return;
        await token.run(() => portalApi.del('/api-token'));
        setNewToken('');
        refresh();
    };

    return (
        <div className="space-y-md">
            <PageHeader title="Settings" subtitle="Your profile, notifications and integrations." />
            {saved && <Notice tone="success">{saved}</Notice>}

            <Card title="Profile">
                {profile.error && <Notice tone="error">{profile.error}</Notice>}
                <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
                    <TextInput label="Your name" required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                    <TextInput label="Your phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                    {isOwner && (
                        <>
                            <TextInput label="Company name" required value={profileForm.company_name} onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })} />
                            <TextInput label="Primary contact" value={profileForm.contact_name} onChange={(e) => setProfileForm({ ...profileForm, contact_name: e.target.value })} />
                            <div className="sm:col-span-2">
                                <TextInput label="Billing address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                            </div>
                        </>
                    )}
                    <div className="sm:col-span-2"><Button type="submit" disabled={profile.busy}>Save profile</Button></div>
                </form>
            </Card>

            <Card title="Notifications">
                {prefs.error && <Notice tone="error">{prefs.error}</Notice>}
                {!canEditPrefs && <p className="mb-3 text-sm text-on-surface-variant">Only an owner or finance user can change these for the company.</p>}
                <div className="grid gap-md md:grid-cols-2">
                    <div>
                        <h3 className="mb-1 text-sm font-semibold uppercase text-on-surface-variant">Channels</h3>
                        {CHANNELS.map(([key, label]) => (
                            <Toggle key={key} label={label} disabled={!canEditPrefs} checked={Boolean(notificationPrefs[key])} onChange={(value) => setNotificationPrefs({ ...notificationPrefs, [key]: value })} />
                        ))}
                    </div>
                    <div>
                        <h3 className="mb-1 text-sm font-semibold uppercase text-on-surface-variant">What to receive</h3>
                        {CATEGORIES.map(([key, label]) => (
                            <Toggle key={key} label={label} disabled={!canEditPrefs} checked={Boolean(notificationPrefs[key])} onChange={(value) => setNotificationPrefs({ ...notificationPrefs, [key]: value })} />
                        ))}
                    </div>
                </div>
                {canEditPrefs && <div className="mt-3"><Button onClick={savePrefs} disabled={prefs.busy}>Save notification settings</Button></div>}
            </Card>

            <Card title="Change password">
                {password.error && <Notice tone="error">{password.error}</Notice>}
                <form onSubmit={savePassword} className="grid gap-3 sm:grid-cols-3">
                    <TextInput label="Current password" type="password" required autoComplete="current-password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
                    <TextInput label="New password" type="password" required minLength={8} autoComplete="new-password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} />
                    <TextInput label="Confirm new password" type="password" required autoComplete="new-password" value={passwordForm.password_confirmation} onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })} />
                    <div className="sm:col-span-3"><Button type="submit" disabled={password.busy}>Update password</Button></div>
                </form>
            </Card>

            {isOwner && (
                <Card title="Accounting integration (API access)">
                    <p className="mb-3 text-sm text-on-surface-variant">
                        Give your accounting software read-only access to your invoices and history. Send the token as an
                        <code className="mx-1 rounded bg-surface-container-high px-1">Authorization: Bearer …</code> header to
                        <code className="mx-1 rounded bg-surface-container-high px-1">/api/portal/invoices</code>,
                        <code className="mx-1 rounded bg-surface-container-high px-1">/api/portal/history</code> or
                        <code className="mx-1 rounded bg-surface-container-high px-1">/api/portal/statement</code>.
                    </p>
                    {token.error && <Notice tone="error">{token.error}</Notice>}
                    {newToken && (
                        <div className="mb-3">
                            <Notice tone="warning">Copy this token now. It will not be shown again.</Notice>
                            <code className="mt-2 block break-all rounded bg-surface-container-high p-3 text-sm text-white">{newToken}</code>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <Button onClick={createToken} disabled={token.busy}>{customer.has_api_token ? 'Generate a new token' : 'Generate token'}</Button>
                        {customer.has_api_token && <Button variant="ghost" onClick={revokeToken} disabled={token.busy}>Revoke access</Button>}
                    </div>
                </Card>
            )}
        </div>
    );
}
