import React, { useEffect, useState } from 'react';

export function formatMoney(amount, currency = 'NGN') {
    if (amount === null || amount === undefined || amount === '') return '—';
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(amount));
    } catch (error) {
        return `${currency} ${Number(amount).toFixed(2)}`;
    }
}

export function formatDate(value) {
    if (!value) return '—';
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function titleCase(value) {
    return String(value ?? '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const statusTones = {
    delivered: 'green', cleared: 'green', paid: 'green', confirmed: 'green', purchased: 'green', won: 'green', active: 'green', converted: 'green', accepted: 'green', answered: 'green', arrived: 'green',
    pending: 'amber', unpaid: 'amber', partial: 'amber', not_cleared: 'amber', awaiting_approval: 'amber', searching: 'amber', open: 'amber', documentation: 'amber', auction_won: 'amber',
    shipping: 'blue', in_transit: 'blue', customs: 'blue', on_vessel: 'blue', submitted: 'blue', approved: 'blue', found: 'blue',
    cancelled: 'red', rejected: 'red', declined: 'red', suspended: 'red', overdue: 'red', void: 'gray', closed: 'gray',
};

const toneClasses = {
    green: 'bg-green-500/15 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    gray: 'bg-white/10 text-on-surface-variant border-white/10',
};

export function StatusBadge({ status, tone }) {
    if (!status) return null;
    const key = tone || statusTones[String(status).toLowerCase()] || 'gray';
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${toneClasses[key]}`}>
            {titleCase(status)}
        </span>
    );
}

export function Card({ title, action, children, className = '' }) {
    return (
        <section className={`rounded-xl border border-white/10 bg-surface-container ${className}`}>
            {(title || action) && (
                <header className="flex items-center justify-between gap-3 border-b border-white/10 px-md py-sm">
                    <h2 className="font-title-md text-lg font-semibold text-white">{title}</h2>
                    {action}
                </header>
            )}
            <div className="p-md">{children}</div>
        </section>
    );
}

export function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                {subtitle && <p className="mt-1 text-on-surface-variant">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
    const variants = {
        primary: 'bg-secondary text-on-secondary hover:brightness-110',
        ghost: 'border border-outline-variant text-on-surface hover:bg-surface-container-high',
        danger: 'bg-red-500/90 text-white hover:bg-red-500',
    };
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-md py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:outline-none';

export function Field({ label, hint, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-xs text-on-surface-variant/70">{hint}</span>}
        </label>
    );
}

export function TextInput({ label, hint, ...props }) {
    return (
        <Field label={label} hint={hint}>
            <input {...props} className={inputClass} />
        </Field>
    );
}

export function TextArea({ label, hint, ...props }) {
    return (
        <Field label={label} hint={hint}>
            <textarea rows={4} {...props} className={inputClass} />
        </Field>
    );
}

export function Select({ label, hint, children, ...props }) {
    return (
        <Field label={label} hint={hint}>
            <select {...props} className={inputClass}>{children}</select>
        </Field>
    );
}

export function Notice({ tone = 'info', children }) {
    const tones = {
        info: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
        success: 'border-green-500/30 bg-green-500/10 text-green-300',
        error: 'border-red-500/30 bg-red-500/10 text-red-300',
        warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    };
    return <div className={`rounded-lg border p-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function Spinner({ label = 'Loading…' }) {
    return <div className="animate-pulse py-10 text-center text-on-surface-variant">{label}</div>;
}

export function Empty({ children }) {
    return <div className="rounded-lg border border-dashed border-white/15 p-lg text-center text-on-surface-variant">{children}</div>;
}

export function Modal({ title, onClose, children }) {
    useEffect(() => {
        const onKey = (event) => event.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
            <div
                className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-surface-container p-md sm:max-w-lg sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="mb-md flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-white" aria-label="Close">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/** Small data-loading hook: { data, error, loading, reload }. */
export function useLoad(loader, deps = []) {
    const [state, setState] = useState({ data: null, error: null, loading: true });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setState((current) => ({ ...current, loading: true, error: null }));
        loader()
            .then((data) => !cancelled && setState({ data, error: null, loading: false }))
            .catch((error) => !cancelled && setState({ data: null, error: error.message, loading: false }));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, tick]);

    return { ...state, reload: () => setTick((value) => value + 1) };
}

export function useAction() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const run = async (fn) => {
        setBusy(true);
        setError('');
        try {
            return await fn();
        } catch (caught) {
            setError(caught.message);
            return undefined;
        } finally {
            setBusy(false);
        }
    };
    return { busy, error, setError, run };
}

export function StatTile({ label, value, icon, tone = 'text-white' }) {
    return (
        <div className="rounded-xl border border-white/10 bg-surface-container p-md">
            <div className="flex items-center justify-between text-on-surface-variant">
                <span className="text-sm">{label}</span>
                {icon && <span className="material-symbols-outlined text-xl">{icon}</span>}
            </div>
            <div className={`mt-2 text-2xl font-bold ${tone}`}>{value}</div>
        </div>
    );
}

export function ProgressBar({ value }) {
    const width = Math.max(0, Math.min(100, Number(value) || 0));
    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${width}%` }} />
        </div>
    );
}
