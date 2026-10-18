import React, { useRef, useState } from 'react';
import portalApi from '../../services/portalApi';
import { usePortal } from '../../contexts/PortalContext';
import { Button, Card, DataTable, Empty, Modal, Notice, PageHeader, Select, Spinner, StatTile, StatusBadge, TextArea, TextInput, ViewToggle, formatDate, formatMoney, titleCase, useAction, useLoad, useViewMode } from '../../components/portal/ui';

function PayModal({ invoice, methods, bankDetails, credit, currency, onClose, onDone }) {
    const fileRef = useRef(null);
    const manual = methods.filter((method) => method.kind === 'manual');
    const hasCredit = methods.some((method) => method.key === 'account_credit') && credit > 0;
    const { busy, error, run } = useAction();
    const [mode, setMode] = useState(manual.length ? 'manual' : 'credit');
    const [form, setForm] = useState({ method: manual[0]?.key || '', amount: String(invoice.balance), reference: '', note: '' });
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
    const method = manual.find((item) => item.key === form.method);

    const submit = async (event) => {
        event.preventDefault();
        if (mode === 'credit') {
            const result = await run(() => portalApi.post(`/invoices/${invoice.id}/apply-credit`, { amount: Number(form.amount) }));
            if (result) onDone(result.message);
            return;
        }

        const body = new FormData();
        body.append('method', form.method);
        body.append('amount', form.amount);
        if (form.reference) body.append('reference', form.reference);
        if (form.note) body.append('note', form.note);
        const file = fileRef.current?.files?.[0];
        if (file) body.append('proof', file);

        const result = await run(() => portalApi.upload(`/invoices/${invoice.id}/payments`, body));
        if (result) onDone(result.message);
    };

    return (
        <Modal title={`Pay ${invoice.invoice_number}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                {error && <Notice tone="error">{error}</Notice>}
                <div className="rounded-lg bg-surface-container-high p-3 text-sm">
                    Balance due: <strong className="text-white">{formatMoney(invoice.balance, invoice.currency)}</strong>
                </div>

                {manual.length > 0 && hasCredit && (
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setMode('manual')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === 'manual' ? 'border-secondary text-secondary' : 'border-outline-variant text-on-surface'}`}>Transfer / deposit</button>
                        <button type="button" onClick={() => setMode('credit')} className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === 'credit' ? 'border-secondary text-secondary' : 'border-outline-variant text-on-surface'}`}>Account credit</button>
                    </div>
                )}

                {mode === 'manual' ? (
                    <>
                        <Select label="Payment method" value={form.method} onChange={set('method')}>
                            {manual.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                        </Select>
                        {(method?.instructions || bankDetails) && (
                            <div className="whitespace-pre-line rounded-lg border border-white/10 bg-surface-container-high p-3 text-sm text-on-surface">
                                {method?.instructions || bankDetails}
                            </div>
                        )}
                        <TextInput label="Amount paid" type="number" step="0.01" min="0.01" max={invoice.balance} required value={form.amount} onChange={set('amount')} />
                        <TextInput label="Transaction reference" value={form.reference} onChange={set('reference')} />
                        <label className="block">
                            <span className="mb-1 block text-sm text-on-surface-variant">Proof of payment (PDF or image)</span>
                            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-sm text-on-surface" />
                        </label>
                        <TextArea label="Note (optional)" rows={2} value={form.note} onChange={set('note')} />
                        <p className="text-xs text-on-surface-variant">OD Automotive will verify the payment and update your invoice.</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-on-surface-variant">Available credit: <strong className="text-white">{formatMoney(credit, currency)}</strong></p>
                        <TextInput label="Amount to apply" type="number" step="0.01" min="0.01" max={Math.min(invoice.balance, credit)} required value={form.amount} onChange={set('amount')} />
                    </>
                )}

                <Button type="submit" disabled={busy} className="w-full">{busy ? 'Submitting…' : mode === 'credit' ? 'Apply credit' : 'Submit payment'}</Button>
            </form>
        </Modal>
    );
}

export default function PortalInvoicesPage() {
    const { can, paymentMethods, customer, config } = usePortal();
    const { data, error, loading, reload } = useLoad(() => portalApi.get('/invoices'));
    const [paying, setPaying] = useState(null);
    const [message, setMessage] = useState('');
    const [statementCurrency, setStatementCurrency] = useState('');
    const [showStatement, setShowStatement] = useState(false);
    const [mode, setMode] = useViewMode('invoices');

    const currentStatement = useLoad(
        () => portalApi.get('/statement', statementCurrency ? { currency: statementCurrency } : undefined),
        [statementCurrency, data?.items?.length]
    );

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    const terms = paymentMethods.find((method) => method.key === 'credit_terms');
    const stm = currentStatement.data;

    return (
        <div className="space-y-md">
            <PageHeader
                title="Invoices & payments"
                subtitle={customer?.credit_terms_days > 0 && terms ? `Your account is on ${customer.credit_terms_days}-day credit terms.` : 'Pay invoices and download statements.'}
                actions={<>
                    <ViewToggle mode={mode} onChange={setMode} />
                    <a href={portalApi.url('/invoices/export')} className="rounded-lg border border-outline-variant px-md py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high">Export CSV</a>
                    <Button variant="ghost" onClick={() => setShowStatement((value) => !value)}>{showStatement ? 'Hide statement' : 'Statement'}</Button>
                </>}
            />

            {message && <Notice tone="success">{message}</Notice>}

            <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
                {data.totals.length === 0 && <StatTile label="Outstanding" value="Nothing due" tone="text-green-400" />}
                {data.totals.map((total) => (
                    <StatTile key={total.currency} label={`Outstanding (${total.currency})`} value={formatMoney(total.outstanding, total.currency)} tone={total.outstanding > 0 ? 'text-amber-300' : 'text-green-400'} />
                ))}
                <StatTile label="Account credit" value={formatMoney(data.credit_balance, config?.currency || 'NGN')} icon="account_balance_wallet" />
            </div>

            {showStatement && stm && (
                <Card
                    title="Statement of account"
                    action={<div className="flex items-center gap-3">
                        {stm.currencies.length > 1 && (
                            <select value={stm.currency} onChange={(event) => setStatementCurrency(event.target.value)} className="rounded border border-outline-variant bg-surface-container-high px-2 py-1 text-sm text-on-surface">
                                {stm.currencies.map((currency) => <option key={currency}>{currency}</option>)}
                            </select>
                        )}
                        <a className="text-sm font-semibold text-secondary hover:underline" href={portalApi.url('/statement/pdf', { currency: stm.currency })}>Download PDF</a>
                    </div>}
                >
                    {stm.lines.length === 0 ? <Empty>No activity yet.</Empty> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-xs uppercase text-on-surface-variant">
                                    <tr><th className="py-2 pr-3">Date</th><th className="pr-3">Reference</th><th className="pr-3">Description</th><th className="pr-3 text-right">Invoiced</th><th className="pr-3 text-right">Paid</th><th className="text-right">Balance</th></tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {stm.lines.map((line, index) => (
                                        <tr key={index}>
                                            <td className="py-2 pr-3 whitespace-nowrap">{formatDate(line.date)}</td>
                                            <td className="pr-3 whitespace-nowrap">{line.reference}</td>
                                            <td className="pr-3">{line.description}</td>
                                            <td className="pr-3 text-right">{line.debit ? formatMoney(line.debit, stm.currency) : ''}</td>
                                            <td className="pr-3 text-right text-green-400">{line.credit ? formatMoney(line.credit, stm.currency) : ''}</td>
                                            <td className="text-right font-semibold text-white">{formatMoney(line.balance, stm.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-3 text-right text-sm">Balance due: <strong className="text-white">{formatMoney(stm.balance_due, stm.currency)}</strong></div>
                        </div>
                    )}
                </Card>
            )}

            {data.items.length === 0 ? <Empty>No invoices yet. They appear here as soon as OD Automotive issues them.</Empty> : mode === 'table' ? (
                <DataTable columns={['Invoice', 'VIN / reference', 'Service', 'Issued', 'Due', { label: 'Amount', right: true }, { label: 'Balance', right: true }, 'Status', '']}>
                    {data.items.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-surface-container-high">
                            <td className="whitespace-nowrap px-md py-3 font-semibold text-white">{invoice.invoice_number}</td>
                            <td className="px-md py-3 text-on-surface">{invoice.reference ? (invoice.reference_is_vin ? <span className="font-mono text-xs">VIN {invoice.reference}</span> : invoice.reference) : '—'}</td>
                            <td className="px-md py-3 text-on-surface-variant">{invoice.service}</td>
                            <td className="whitespace-nowrap px-md py-3 text-on-surface-variant">{formatDate(invoice.date_issued)}</td>
                            <td className="whitespace-nowrap px-md py-3 text-on-surface-variant">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</td>
                            <td className="whitespace-nowrap px-md py-3 text-right text-white">{formatMoney(invoice.amount, invoice.currency)}</td>
                            <td className="whitespace-nowrap px-md py-3 text-right text-on-surface">{formatMoney(invoice.balance, invoice.currency)}</td>
                            <td className="px-md py-3"><StatusBadge status={invoice.overdue ? 'overdue' : invoice.status} /></td>
                            <td className="whitespace-nowrap px-md py-3 text-right">
                                <a href={portalApi.url(`/invoices/${invoice.id}/download`)} className="mr-3 text-secondary hover:underline">PDF</a>
                                {can('pay') && ['unpaid', 'partial'].includes(invoice.status) && paymentMethods.some((method) => method.kind === 'manual' || method.key === 'account_credit') && (
                                    <button onClick={() => setPaying(invoice)} className="font-semibold text-secondary hover:underline">Pay</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </DataTable>
            ) : (
                <div className="space-y-3">
                    {data.items.map((invoice) => (
                        <Card key={invoice.id}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-white">{invoice.invoice_number}</span>
                                        <StatusBadge status={invoice.overdue ? 'overdue' : invoice.status} />
                                    </div>
                                    {invoice.reference_is_vin && <div className="mt-1 font-mono text-xs text-on-surface">VIN {invoice.reference}</div>}
                                    <div className="mt-1 text-sm text-on-surface-variant">{invoice.service}{invoice.description ? ` · ${invoice.description}` : ''}</div>
                                    <div className="text-xs text-on-surface-variant">Issued {formatDate(invoice.date_issued)}{invoice.due_date ? ` · Due ${formatDate(invoice.due_date)}` : ''}</div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <div className="text-lg font-bold text-white">{formatMoney(invoice.amount, invoice.currency)}</div>
                                    {invoice.amount_paid > 0 && <div className="text-xs text-on-surface-variant">Paid {formatMoney(invoice.amount_paid, invoice.currency)} · Balance {formatMoney(invoice.balance, invoice.currency)}</div>}
                                </div>
                            </div>

                            {invoice.payments.length > 0 && (
                                <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm">
                                    {invoice.payments.map((payment) => (
                                        <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-on-surface-variant">{payment.receipt_number} · {titleCase(payment.method)} · {formatMoney(payment.amount, invoice.currency)}{payment.reference ? ` · ${payment.reference}` : ''}</span>
                                            <span className="flex items-center gap-2">
                                                {payment.status === 'rejected' && payment.review_note && <span className="text-xs text-red-400">{payment.review_note}</span>}
                                                <StatusBadge status={payment.status} />
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-3 flex flex-wrap gap-3">
                                <a href={portalApi.url(`/invoices/${invoice.id}/download`)} className="rounded-lg border border-outline-variant px-md py-1.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high">Download PDF</a>
                                {can('pay') && ['unpaid', 'partial'].includes(invoice.status) && paymentMethods.some((method) => method.kind === 'manual' || method.key === 'account_credit') && (
                                    <Button onClick={() => setPaying(invoice)}>Pay this invoice</Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {paying && (
                <PayModal
                    invoice={paying}
                    methods={paymentMethods}
                    bankDetails={data.bank_details}
                    credit={data.credit_balance}
                    currency={config?.currency || 'NGN'}
                    onClose={() => setPaying(null)}
                    onDone={(text) => { setPaying(null); setMessage(text); reload(); currentStatement.reload(); }}
                />
            )}
        </div>
    );
}
