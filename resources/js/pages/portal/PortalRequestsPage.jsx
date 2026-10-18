import React, { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import portalApi from '../../services/portalApi';
import { usePortal } from '../../contexts/PortalContext';
import { Button, Card, Empty, Notice, PageHeader, Select, Spinner, StatusBadge, TextArea, TextInput, formatDate, formatMoney, titleCase, useAction, useLoad } from '../../components/portal/ui';

const TYPE_LABELS = {
    quote: 'Shipping quote',
    auction: 'Auction purchase',
    trucking: 'Trucking',
    clearance: 'Customs clearance',
};

const EMPTY_FORM = { type: 'quote', vehicle_year: '', vehicle_make: '', vehicle_model: '', origin: '', destination: '', max_budget: '', estimated_value: '', notes: '' };

function NewRequestForm({ allowed, prefill, onDone }) {
    const { busy, error, run } = useAction();
    const receiptRef = useRef(null);
    const [form, setForm] = useState({ ...EMPTY_FORM, ...(prefill || {}), type: allowed.includes(prefill?.type) ? prefill.type : allowed[0] || 'quote' });
    const [message, setMessage] = useState('');
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
    const isAuction = form.type === 'auction';

    const submit = async (event) => {
        event.preventDefault();
        setMessage('');
        const payload = { ...form };
        Object.keys(payload).forEach((key) => payload[key] === '' && delete payload[key]);

        // The vehicle sales receipt is optional; a request with one is sent as a file upload.
        const receipt = receiptRef.current?.files?.[0];
        const result = await run(() => {
            if (!receipt) return portalApi.post('/requests', payload);
            const body = new FormData();
            Object.entries(payload).forEach(([key, value]) => body.append(key, value));
            body.append('receipt', receipt);
            return portalApi.upload('/requests', body);
        });

        if (result) {
            setMessage(result.message);
            setForm({ ...EMPTY_FORM, type: form.type });
            if (receiptRef.current) receiptRef.current.value = '';
            onDone();
        }
    };

    if (allowed.length === 0) {
        return <Notice tone="info">Online requests are switched off. Please contact OD Automotive directly.</Notice>;
    }

    return (
        <form onSubmit={submit} className="space-y-3">
            {message && <Notice tone="success">{message}</Notice>}
            {error && <Notice tone="error">{error}</Notice>}
            <Select label="What do you need?" value={form.type} onChange={set('type')}>
                {allowed.map((type) => <option key={type} value={type}>{TYPE_LABELS[type] || titleCase(type)}</option>)}
            </Select>
            <div className="grid gap-3 sm:grid-cols-3">
                <TextInput label="Year" required value={form.vehicle_year} onChange={set('vehicle_year')} />
                <TextInput label="Make" required value={form.vehicle_make} onChange={set('vehicle_make')} />
                <TextInput label="Model" required value={form.vehicle_model} onChange={set('vehicle_model')} />
            </div>
            {isAuction ? (
                <TextInput label="Maximum budget (USD)" type="number" min="0" step="0.01" required value={form.max_budget} onChange={set('max_budget')} />
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <TextInput label="Origin" required value={form.origin} onChange={set('origin')} placeholder="e.g. Houston, TX" />
                        <TextInput label="Destination" required value={form.destination} onChange={set('destination')} placeholder="e.g. Lagos" />
                    </div>
                    <TextInput label="Estimated vehicle value (optional)" type="number" min="0" step="0.01" value={form.estimated_value} onChange={set('estimated_value')} />
                </>
            )}
            <TextArea label={isAuction ? 'Requirements, lot link or colour preferences' : 'Notes'} rows={3} value={form.notes} onChange={set('notes')} />
            <label className="block">
                <span className="mb-1 block text-sm font-medium text-on-surface-variant">Vehicle sales receipt <span className="font-normal">(optional)</span></span>
                <input ref={receiptRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-sm text-on-surface" />
                <span className="mt-1 block text-xs text-on-surface-variant/70">PDF or photo, up to 8 MB. It is saved with this request.</span>
            </label>
            <Button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</Button>
        </form>
    );
}

export default function PortalRequestsPage() {
    const location = useLocation();
    const { config, can, customer } = usePortal();
    const requests = useLoad(() => portalApi.get('/requests'));
    const quotes = useLoad(() => portalApi.get('/quotes'));
    const action = useAction();
    const [note, setNote] = useState('');

    const allowed = config?.requestable_services || [];
    const prefill = location.state?.prefill ? { ...location.state.prefill.prefill, type: location.state.prefill.type } : null;
    const canApprove = can('approve');

    const decide = async (id, decision) => {
        const result = await action.run(() => portalApi.post(`/requests/${id}/decision`, { decision, note }));
        if (result) {
            setNote('');
            requests.reload();
        }
    };

    const respond = async (id, response) => {
        const verb = response === 'accept' ? 'accept this quote' : 'decline this quote';
        if (!window.confirm(`Are you sure you want to ${verb}?`)) return;
        const result = await action.run(() => portalApi.post(`/quotes/${id}/respond`, { response }));
        if (result) {
            quotes.reload();
            requests.reload();
        }
    };

    const waiting = (requests.data?.items || []).filter((item) => item.status === 'awaiting_approval');
    const priced = (quotes.data?.items || []).filter((quote) => quote.quoted_amount !== null);

    return (
        <div className="space-y-md">
            <PageHeader title="Requests & quotes" subtitle="Ask OD Automotive for a service and respond to quotes." />
            {action.error && <Notice tone="error">{action.error}</Notice>}

            {customer?.approval_threshold != null && (
                <Notice tone="info">Requests of {formatMoney(customer.approval_threshold, 'USD')} or more from operations users need sign-off from an owner or finance user.</Notice>
            )}

            {priced.length > 0 && (
                <Card title="Quotes from OD Automotive">
                    <ul className="divide-y divide-white/10">
                        {priced.map((quote) => {
                            const answered = quote.customer_response;
                            return (
                                <li key={quote.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-white">{quote.vehicle_year} {quote.vehicle_make} {quote.vehicle_model} · {quote.service}</div>
                                        <div className="text-sm text-on-surface-variant">{quote.origin} → {quote.destination}</div>
                                        {quote.quote_notes && <div className="text-sm text-on-surface-variant">{quote.quote_notes}</div>}
                                    </div>
                                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                                        <span className="text-lg font-bold text-white">{formatMoney(quote.quoted_amount, 'USD')}</span>
                                        {answered ? <StatusBadge status={answered} /> : quote.status === 'converted' ? <StatusBadge status="converted" /> : canApprove ? (
                                            <>
                                                <Button disabled={action.busy} onClick={() => respond(quote.id, 'accept')}>Accept</Button>
                                                <Button variant="ghost" disabled={action.busy} onClick={() => respond(quote.id, 'decline')}>Decline</Button>
                                            </>
                                        ) : <span className="text-xs text-on-surface-variant">Awaiting an owner or finance user</span>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            )}

            {canApprove && waiting.length > 0 && (
                <Card title="Waiting for your approval">
                    <TextInput label="Note (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
                    <ul className="mt-3 divide-y divide-white/10">
                        {waiting.map((item) => (
                            <li key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="font-semibold text-white">{TYPE_LABELS[item.type] || titleCase(item.type)}: {item.payload.vehicle_year} {item.payload.vehicle_make} {item.payload.vehicle_model}</div>
                                    <div className="text-sm text-on-surface-variant">Requested by {item.requested_by} · {formatMoney(item.estimated_value, 'USD')}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button disabled={action.busy} onClick={() => decide(item.id, 'approve')}>Approve</Button>
                                    <Button variant="danger" disabled={action.busy} onClick={() => decide(item.id, 'decline')}>Decline</Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {can('request') && (
                <Card title="New request">
                    <NewRequestForm allowed={allowed} prefill={prefill} onDone={() => { requests.reload(); quotes.reload(); }} />
                </Card>
            )}

            <Card title="Your requests">
                {requests.loading ? <Spinner /> : requests.data.items.length === 0 ? <Empty>No requests yet.</Empty> : (
                    <ul className="divide-y divide-white/10">
                        {requests.data.items.map((item) => (
                            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <div className="font-semibold text-white">{TYPE_LABELS[item.type] || titleCase(item.type)}: {item.payload.vehicle_year} {item.payload.vehicle_make} {item.payload.vehicle_model}</div>
                                    <div className="text-xs text-on-surface-variant">{formatDate(item.created_at)} · by {item.requested_by}{item.decision_note ? ` · "${item.decision_note}"` : ''}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.linked_status && <StatusBadge status={item.linked_status} />}
                                    <StatusBadge status={item.status} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
