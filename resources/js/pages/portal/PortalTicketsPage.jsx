import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import portalApi from '../../services/portalApi';
import { Button, Card, Empty, Notice, PageHeader, Spinner, StatusBadge, TextArea, TextInput, formatDate, useAction, useLoad } from '../../components/portal/ui';

export function PortalTicketsPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { data, error, loading, reload } = useLoad(() => portalApi.get('/tickets'));
    const { busy, error: formError, run } = useAction();
    const [form, setForm] = useState({ subject: '', body: '' });

    // ?record=shipments:12 ties the question to a vehicle.
    const [recordType, recordId] = (params.get('record') || '').split(':');
    const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        const payload = { ...form };
        if (recordType && recordId) {
            payload.record_type = recordType;
            payload.record_id = Number(recordId);
        }
        const result = await run(() => portalApi.post('/tickets', payload));
        if (result) {
            setForm({ subject: '', body: '' });
            reload();
            navigate(`/portal/tickets/${result.id}`);
        }
    };

    return (
        <div className="space-y-md">
            <PageHeader title="Support" subtitle="Ask OD Automotive a question. Questions tied to a vehicle keep the full context." />

            <Card title="New question">
                {recordType && recordId && <div className="mb-3 text-sm text-on-surface-variant">This question will be linked to shipment #{recordId}.</div>}
                {formError && <Notice tone="error">{formError}</Notice>}
                <form onSubmit={submit} className="space-y-3">
                    <TextInput label="Subject" required value={form.subject} onChange={set('subject')} />
                    <TextArea label="Message" required value={form.body} onChange={set('body')} />
                    <Button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send'}</Button>
                </form>
            </Card>

            <Card title="Your conversations">
                {loading ? <Spinner /> : error ? <Notice tone="error">{error}</Notice> : data.items.length === 0 ? <Empty>No conversations yet.</Empty> : (
                    <ul className="divide-y divide-white/10">
                        {data.items.map((ticket) => (
                            <li key={ticket.id}>
                                <Link to={`/portal/tickets/${ticket.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-surface-container-high">
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold text-white">{ticket.subject}</div>
                                        <div className="text-xs text-on-surface-variant">{ticket.ticket_number} · {formatDate(ticket.last_message_at)}</div>
                                    </div>
                                    <StatusBadge status={ticket.status} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}

export function PortalTicketDetailPage() {
    const { id } = useParams();
    const { data, error, loading, reload } = useLoad(() => portalApi.get(`/tickets/${id}`), [id]);
    const { busy, error: formError, run } = useAction();
    const [body, setBody] = useState('');

    if (loading) return <Spinner />;
    if (error) return <Notice tone="error">{error}</Notice>;

    const { ticket, messages } = data;

    const send = async (event) => {
        event.preventDefault();
        const result = await run(() => portalApi.post(`/tickets/${id}/messages`, { body }));
        if (result) {
            setBody('');
            reload();
        }
    };

    const close = async () => {
        await run(() => portalApi.post(`/tickets/${id}/close`));
        reload();
    };

    return (
        <div className="space-y-md">
            <Link to="/portal/tickets" className="text-sm text-secondary hover:underline">← All conversations</Link>
            <PageHeader title={ticket.subject} subtitle={ticket.ticket_number} actions={<StatusBadge status={ticket.status} />} />

            <div className="space-y-3">
                {messages.map((message) => (
                    <div key={message.id} className={`max-w-2xl rounded-xl border p-md ${message.sender_type === 'admin' ? 'border-secondary/30 bg-secondary/10' : 'ml-auto border-white/10 bg-surface-container'}`}>
                        <div className="mb-1 text-xs text-on-surface-variant">{message.sender_type === 'admin' ? 'OD Automotive' : message.sender_name} · {formatDate(message.created_at)}</div>
                        <div className="whitespace-pre-wrap text-white">{message.body}</div>
                    </div>
                ))}
            </div>

            {ticket.status !== 'closed' ? (
                <Card>
                    {formError && <Notice tone="error">{formError}</Notice>}
                    <form onSubmit={send} className="space-y-3">
                        <TextArea label="Reply" required value={body} onChange={(event) => setBody(event.target.value)} />
                        <div className="flex gap-3">
                            <Button type="submit" disabled={busy}>Send reply</Button>
                            <Button type="button" variant="ghost" disabled={busy} onClick={close}>Mark as resolved</Button>
                        </div>
                    </form>
                </Card>
            ) : (
                <Notice tone="info">This conversation is closed. Reply to reopen it.</Notice>
            )}
            {ticket.status === 'closed' && (
                <form onSubmit={send} className="space-y-3">
                    <TextArea label="Reply to reopen" required value={body} onChange={(event) => setBody(event.target.value)} />
                    <Button type="submit" disabled={busy}>Reopen with reply</Button>
                </form>
            )}
        </div>
    );
}
