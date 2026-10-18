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

/** Remembers the card/table choice per page in this browser. */
export function useViewMode(key, fallback = 'cards') {
    const storageKey = `od-portal-view-${key}`;
    const [mode, setMode] = useState(() => {
        try {
            const saved = window.localStorage.getItem(storageKey);
            return saved === 'cards' || saved === 'table' ? saved : fallback;
        } catch (error) {
            return fallback;
        }
    });

    const update = (value) => {
        setMode(value);
        try {
            window.localStorage.setItem(storageKey, value);
        } catch (error) {
            // Private mode or blocked storage: the choice just won't persist.
        }
    };

    return [mode, update];
}

export function ViewToggle({ mode, onChange }) {
    const options = [['cards', 'grid_view', 'Cards'], ['table', 'table_rows', 'Table']];
    return (
        <div className="inline-flex overflow-hidden rounded-lg border border-outline-variant" role="group" aria-label="Switch between card and table view">
            {options.map(([value, icon, label]) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => onChange(value)}
                    aria-pressed={mode === value}
                    title={`${label} view`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${mode === value ? 'bg-secondary text-on-secondary' : 'text-on-surface hover:bg-surface-container-high'}`}
                >
                    <span className="material-symbols-outlined text-base">{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    );
}

/** Shared look for portal tables: scrolls sideways on small screens instead of squashing. */
export function DataTable({ columns, children }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface-container">
            <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-white/10 text-left text-xs uppercase text-on-surface-variant">
                    <tr>
                        {columns.map((column) => (
                            <th key={column.label || column} className={`px-md py-3 font-semibold ${column.right ? 'text-right' : ''}`}>{column.label || column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">{children}</tbody>
            </table>
        </div>
    );
}

/** A reference line that leads with the VIN and keeps the OD reference as the secondary. */
export function ReferenceText({ item }) {
    if (item.reference_is_vin) {
        return (
            <span>
                <span className="font-mono text-xs">VIN {item.reference}</span>
                {item.reference_default && item.reference_default !== item.reference && <span className="text-on-surface-variant/70"> · {item.reference_default}</span>}
            </span>
        );
    }
    return <span>{item.reference}</span>;
}

/** Small tag showing why a search result matched (VIN first, then other details). */
export function MatchTag({ field }) {
    if (!field) return null;
    return (
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${field === 'VIN' ? 'border-secondary/50 text-secondary' : 'border-white/15 text-on-surface-variant'}`}>
            {field === 'VIN' ? 'VIN match' : field}
        </span>
    );
}

export const PAGE_SIZES = [10, 25, 50, 100];

/** Slices a list into pages and resets to page 1 whenever the list or page size changes. */
export function usePagination(items, initialSize = 10) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialSize);
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(page, pages);
    const start = (current - 1) * pageSize;

    useEffect(() => setPage(1), [total, pageSize]);

    return {
        page: current,
        pages,
        pageSize,
        total,
        start, // zero-based index of the first row on this page, for row numbering
        rows: items.slice(start, start + pageSize),
        setPage,
        setPageSize,
    };
}

/** Previous / next with page numbers and a rows-per-page choice. */
export function Pagination({ pager }) {
    const { page, pages, pageSize, total, start, setPage, setPageSize } = pager;
    if (total === 0) return null;

    // First, last, and a window around the current page, with gaps marked.
    const numbers = [];
    for (let number = 1; number <= pages; number += 1) {
        if (number === 1 || number === pages || Math.abs(number - page) <= 1) numbers.push(number);
        else if (numbers[numbers.length - 1] !== '…') numbers.push('…');
    }

    const button = 'min-w-[2.25rem] rounded-lg border px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40';

    return (
        <nav className="flex flex-col items-center justify-between gap-3 py-2 text-sm sm:flex-row" aria-label="Pagination">
            <div className="flex items-center gap-3 text-on-surface-variant">
                <span>Showing {start + 1}–{Math.min(start + pageSize, total)} of {total}</span>
                <label className="flex items-center gap-2">
                    <span className="hidden sm:inline">Rows</span>
                    <select
                        value={pageSize}
                        onChange={(event) => setPageSize(Number(event.target.value))}
                        aria-label="Rows per page"
                        className="rounded-lg border border-outline-variant bg-surface-container-high px-2 py-1 text-on-surface"
                    >
                        {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                </label>
            </div>

            {pages > 1 && (
                <div className="flex items-center gap-1">
                    <button type="button" className={`${button} border-outline-variant text-on-surface`} disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
                        <span className="material-symbols-outlined align-middle text-base">chevron_left</span>
                    </button>
                    {numbers.map((number, index) => (number === '…'
                        ? <span key={`gap${index}`} className="px-1 text-on-surface-variant">…</span>
                        : (
                            <button
                                key={number}
                                type="button"
                                onClick={() => setPage(number)}
                                aria-current={number === page ? 'page' : undefined}
                                className={`${button} ${number === page ? 'border-secondary bg-secondary font-semibold text-on-secondary' : 'border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                            >
                                {number}
                            </button>
                        )))}
                    <button type="button" className={`${button} border-outline-variant text-on-surface`} disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page">
                        <span className="material-symbols-outlined align-middle text-base">chevron_right</span>
                    </button>
                </div>
            )}
        </nav>
    );
}
