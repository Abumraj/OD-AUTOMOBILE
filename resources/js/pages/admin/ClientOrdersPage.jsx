import React, { useState } from 'react';

const services = ['All', 'Quote', 'Shipment', 'Trucking', 'Clearance'];

function formatLabel(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ClientOrdersPage() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [service, setService] = useState('All');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const search = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        setExpandedId(null);

        try {
            const response = await fetch(`/api/admin/client-orders?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Unable to find client orders');
            setResult(data);
        } catch (error) {
            setResult(null);
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const orders = result?.orders?.filter((order) => service === 'All' || order.service === service) || [];
    const summary = result?.summary;

    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Client Orders</h1>
                <p className="font-body-lg text-on-surface-variant">Search a client to review their company records across quotes, shipments, trucking, and clearance.</p>
            </div>

            <form onSubmit={search} className="flex flex-col md:flex-row gap-md">
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client name or email" className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm text-on-surface" />
                <button disabled={loading} className="bg-secondary text-on-secondary px-lg py-sm rounded-lg font-bold disabled:opacity-60">{loading ? 'Searching...' : 'Search'}</button>
            </form>

            {message && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-md text-red-400">{message}</div>}

            {summary && <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
                    {[
                        ['All Orders', summary.total],
                        ['Quotes', summary.quotes],
                        ['Shipments', summary.shipments],
                        ['Trucking', summary.truckings],
                        ['Clearance', summary.clearances],
                    ].map(([label, count]) => <div key={label} className="bg-surface-container border border-white/10 rounded-lg p-md"><div className="text-2xl font-bold text-white">{count}</div><div className="text-sm text-on-surface-variant">{label}</div></div>)}
                </div>

                <div className="flex flex-wrap gap-sm">
                    {services.map((item) => <button key={item} type="button" onClick={() => setService(item)} className={`px-md py-sm rounded-lg border ${service === item ? 'bg-secondary text-on-secondary border-secondary' : 'border-outline-variant text-on-surface'}`}>{item}</button>)}
                </div>

                <div className="space-y-sm">
                    {orders.length === 0 && <div className="bg-surface-container border border-white/10 rounded-lg p-lg text-on-surface-variant">No matching orders found.</div>}
                    {orders.map((order, index) => {
                        const orderId = `${order.service}-${order.details.id}-${index}`;
                        const expanded = expandedId === orderId;
                        return <div key={orderId} className="bg-surface-container border border-white/10 rounded-lg overflow-hidden">
                            <button type="button" onClick={() => setExpandedId(expanded ? null : orderId)} className="w-full flex items-center justify-between gap-md p-md text-left hover:bg-surface-container-high">
                                <div><div className="text-white font-bold">{order.service} #{order.details.id}</div><div className="text-sm text-on-surface-variant">{order.date || 'No date recorded'}</div></div>
                                <div className="flex items-center gap-md"><span className="text-sm uppercase text-secondary">{String(order.status || 'unknown').replace(/_/g, ' ')}</span><span className="material-symbols-outlined text-on-surface">{expanded ? 'expand_less' : 'expand_more'}</span></div>
                            </button>
                            {expanded && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-lg gap-y-md border-t border-white/10 p-md">
                                {Object.entries(order.details).map(([key, value]) => <div key={key}><div className="text-xs uppercase text-on-surface-variant">{formatLabel(key)}</div><div className="mt-1 break-words text-white">{value === null || value === '' ? '—' : String(value)}</div></div>)}
                            </div>}
                        </div>;
                    })}
                </div>
            </>}
        </div>
    );
}

export default ClientOrdersPage;
