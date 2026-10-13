import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import portalApi from '../../services/portalApi';
import { usePortal } from '../../contexts/PortalContext';
import { Button, Notice, TextInput, useAction } from '../../components/portal/ui';

function AuthShell({ title, subtitle, children, footer }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-container via-surface to-surface-container-low px-4 py-8">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-white/10 bg-surface-container/80 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="mb-6 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary-container to-secondary shadow-lg">
                            <span className="material-symbols-outlined text-4xl text-white">business_center</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">{title}</h1>
                        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
                    </div>
                    {children}
                </div>
                {footer && <div className="mt-4 text-center text-sm text-on-surface-variant">{footer}</div>}
            </div>
        </div>
    );
}

export function PortalLoginPage() {
    const { refresh, config } = usePortal();
    const navigate = useNavigate();
    const { busy, error, run } = useAction();
    const [form, setForm] = useState({ email: '', password: '' });

    const submit = async (event) => {
        event.preventDefault();
        const ok = await run(() => portalApi.post('/login', form));
        if (ok) {
            await refresh();
            navigate('/portal');
        }
    };

    const canRegister = config?.registration_mode && config.registration_mode !== 'admin_only';

    return (
        <AuthShell
            title="Business Portal"
            subtitle="Sign in to see every service OD Automotive has handled for you."
            footer={canRegister
                ? <>New here? <Link className="text-secondary" to="/portal/register">Create a business account</Link></>
                : <>Accounts are created by OD Automotive. Contact us to get access.</>}
        >
            {config && config.enabled === false && <Notice tone="warning">The portal is temporarily unavailable.</Notice>}
            {error && <Notice tone="error">{error}</Notice>}
            <form onSubmit={submit} className="mt-4 space-y-4">
                <TextInput label="Email" type="email" required autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <TextInput label="Password" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Button type="submit" disabled={busy} className="w-full">{busy ? 'Signing in…' : 'Sign in'}</Button>
            </form>
            <div className="mt-4 text-center text-sm">
                <Link className="text-on-surface-variant hover:text-white" to="/portal/forgot-password">Forgot your password?</Link>
            </div>
        </AuthShell>
    );
}

export function PortalRegisterPage() {
    const { refresh, config } = usePortal();
    const navigate = useNavigate();
    const { busy, error, run } = useAction();
    const [done, setDone] = useState(null);
    const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', phone: '', address: '', password: '', password_confirmation: '' });
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

    if (config && config.registration_mode === 'admin_only') {
        return (
            <AuthShell title="Registration closed" subtitle="Accounts are created by OD Automotive." footer={<Link className="text-secondary" to="/portal/login">Back to sign in</Link>}>
                <Notice tone="info">Please contact OD Automotive and we will set up your business account.</Notice>
            </AuthShell>
        );
    }

    const submit = async (event) => {
        event.preventDefault();
        const result = await run(() => portalApi.post('/register', form));
        if (!result) return;
        if (result.status === 'active') {
            await refresh();
            navigate('/portal');
        } else {
            setDone(result.message);
        }
    };

    if (done) {
        return (
            <AuthShell title="Request received" subtitle="We will be in touch." footer={<Link className="text-secondary" to="/portal/login">Back to sign in</Link>}>
                <Notice tone="success">{done}</Notice>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Create a business account"
            subtitle={config?.registration_mode === 'approval' ? 'New accounts are reviewed by OD Automotive before access is granted.' : 'Get access to your services, invoices and documents.'}
            footer={<>Already registered? <Link className="text-secondary" to="/portal/login">Sign in</Link></>}
        >
            {error && <Notice tone="error">{error}</Notice>}
            <form onSubmit={submit} className="mt-4 space-y-3">
                <TextInput label="Company name" required value={form.company_name} onChange={set('company_name')} />
                <TextInput label="Contact person" required value={form.contact_name} onChange={set('contact_name')} />
                <TextInput label="Email" type="email" required autoComplete="username" value={form.email} onChange={set('email')} />
                <TextInput label="Phone" required value={form.phone} onChange={set('phone')} hint="Include your country code, e.g. +234…" />
                <TextInput label="Address (optional)" value={form.address} onChange={set('address')} />
                <TextInput label="Password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} hint="At least 8 characters." />
                <TextInput label="Confirm password" type="password" required autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} />
                <Button type="submit" disabled={busy} className="w-full">{busy ? 'Creating account…' : 'Create account'}</Button>
            </form>
        </AuthShell>
    );
}

export function PortalForgotPage() {
    const { busy, error, run } = useAction();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        const result = await run(() => portalApi.post('/forgot-password', { email }));
        if (result) setMessage(result.message);
    };

    return (
        <AuthShell title="Reset your password" subtitle="We will email you a link." footer={<Link className="text-secondary" to="/portal/login">Back to sign in</Link>}>
            {error && <Notice tone="error">{error}</Notice>}
            {message ? <Notice tone="success">{message}</Notice> : (
                <form onSubmit={submit} className="space-y-4">
                    <TextInput label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Button type="submit" disabled={busy} className="w-full">{busy ? 'Sending…' : 'Send reset link'}</Button>
                </form>
            )}
        </AuthShell>
    );
}

export function PortalResetPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { busy, error, run } = useAction();
    const [form, setForm] = useState({ password: '', password_confirmation: '' });
    const [message, setMessage] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        const result = await run(() => portalApi.post('/reset-password', {
            email: params.get('email') || '',
            token: params.get('token') || '',
            ...form,
        }));
        if (result) {
            setMessage(result.message);
            setTimeout(() => navigate('/portal/login'), 1500);
        }
    };

    return (
        <AuthShell title="Choose a new password" subtitle="Use at least 8 characters." footer={<Link className="text-secondary" to="/portal/login">Back to sign in</Link>}>
            {error && <Notice tone="error">{error}</Notice>}
            {message ? <Notice tone="success">{message}</Notice> : (
                <form onSubmit={submit} className="space-y-4">
                    <TextInput label="New password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <TextInput label="Confirm password" type="password" required value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                    <Button type="submit" disabled={busy} className="w-full">{busy ? 'Saving…' : 'Update password'}</Button>
                </form>
            )}
        </AuthShell>
    );
}
