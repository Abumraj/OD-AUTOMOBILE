import React, { useState, useEffect } from 'react';

const SERVICE_LABELS = {
    procurements: 'Procurement',
    autosales: 'Autosales',
    truckings: 'Trucking',
    clearances: 'Clearance',
};

function InvoiceGenerator({ service, record, onClose, onGenerated }) {
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        date_issued: new Date().toISOString().split('T')[0],
        notes: '',
        send_email: false,
    });

    const customerEmail = record?.customer_email || record?.client_email;
    const serviceLabel = SERVICE_LABELS[service] || service;

    useEffect(() => {
        if (record) {
            fetchInvoices();
        }
    }, [record]);

    const fetchInvoices = async () => {
        try {
            const response = await fetch(`/api/admin/${service}/${record.id}/invoices`);
            const data = await response.json();
            setInvoices(data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handlePreview = async () => {
        try {
            const previewData = {
                date_issued: formData.date_issued,
                notes: formData.notes,
            };

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/api/admin/${service}/${record.id}/invoice/preview`;
            form.target = '_blank';

            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.content || '';
            form.appendChild(csrfInput);

            Object.keys(previewData).forEach((key) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = previewData[key];
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            showNotification('Opening preview in new window...', 'success');
        } catch (error) {
            console.error('Error previewing invoice:', error);
            showNotification('Failed to preview invoice', 'error');
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/admin/${service}/${record.id}/invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(data.message || 'Invoice generated successfully', 'success');
                fetchInvoices();
                if (onGenerated) onGenerated(data);

                setTimeout(() => {
                    handleDownload(data.invoice_id);
                }, 500);
            } else {
                showNotification(data.error || 'Failed to generate invoice', 'error');
            }
        } catch (error) {
            console.error('Error generating invoice:', error);
            showNotification('Failed to generate invoice', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (invoiceId) => {
        try {
            const response = await fetch(`/api/admin/invoices/${invoiceId}/download`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            showNotification('Failed to download invoice', 'error');
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md overflow-y-auto">
            <div className="bg-surface-container rounded-xl p-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {notification && (
                    <div className={`mb-md p-md rounded-lg ${notification.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {notification.message}
                    </div>
                )}

                <div className="flex items-center justify-between mb-lg">
                    <div>
                        <h3 className="font-headline-md text-white flex items-center gap-sm">
                            <span className="material-symbols-outlined text-secondary-container">request_quote</span>
                            Invoice Generator
                        </h3>
                        <p className="font-body-sm text-on-surface-variant mt-xs">
                            Generate {serviceLabel} invoice for {record?.customer_name || record?.client_name || 'this record'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                    <div>
                        <h4 className="font-title-md text-white mb-md">Generate New Invoice</h4>
                        <form onSubmit={handleGenerate} className="space-y-md">
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Date Issued *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date_issued}
                                    onChange={(e) => setFormData({ ...formData, date_issued: e.target.value })}
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    placeholder="Any additional information for the invoice..."
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                ></textarea>
                            </div>

                            <div className="bg-surface-container-low rounded-lg p-md border border-white/10">
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.send_email}
                                        onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                                        className="w-5 h-5 rounded border-outline accent-secondary-container"
                                    />
                                    <div className="flex-1">
                                        <div className="font-label-md text-white flex items-center gap-xs">
                                            <span className="material-symbols-outlined text-sm text-secondary-container">email</span>
                                            Send invoice to customer email
                                        </div>
                                        <div className="font-caption text-on-surface-variant mt-xs">
                                            {customerEmail ? (
                                                <>Email will be sent to: <span className="text-white">{customerEmail}</span></>
                                            ) : (
                                                <span className="text-red-400">No customer email available</span>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-md">
                                <button
                                    type="button"
                                    onClick={handlePreview}
                                    disabled={loading}
                                    className="bg-surface-container-high text-on-surface px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-sm border border-outline-variant disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">visibility</span>
                                    Preview
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-sm disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">refresh</span>
                                            {formData.send_email ? 'Generating & Sending...' : 'Generating...'}
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">{formData.send_email ? 'send' : 'request_quote'}</span>
                                            {formData.send_email ? 'Generate & Email' : 'Generate'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div>
                        <h4 className="font-title-md text-white mb-md">Previous Invoices</h4>
                        {loadingInvoices ? (
                            <div className="text-center py-lg text-on-surface-variant">
                                <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
                            </div>
                        ) : invoices.length === 0 ? (
                            <div className="bg-surface-container-low rounded-lg p-lg text-center">
                                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-sm">request_quote</span>
                                <p className="font-body-md text-on-surface-variant">
                                    No invoices generated yet
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-sm max-h-[500px] overflow-y-auto">
                                {invoices.map((invoice) => (
                                    <div
                                        key={invoice.id}
                                        className="bg-surface-container-low rounded-lg p-md border border-white/5 hover:border-secondary-container/50 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-sm">
                                            <div className="flex-1">
                                                <div className="font-label-md text-white mb-xs">
                                                    {invoice.invoice_number}
                                                </div>
                                                <div className="flex items-center gap-xs mb-xs">
                                                    <span className="material-symbols-outlined text-secondary-container text-sm">payments</span>
                                                    <span className="font-caption text-on-surface-variant">
                                                        {invoice.currency === 'USD' ? '$' : '₦'}{Number(invoice.amount || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-xs">
                                                    <span className="material-symbols-outlined text-on-surface-variant text-sm">calendar_today</span>
                                                    <span className="font-caption text-on-surface-variant">
                                                        {new Date(invoice.date_issued).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(invoice.id)}
                                                className="bg-secondary-container/20 text-secondary-container px-sm py-xs rounded-lg hover:bg-secondary-container/30 transition-all flex items-center gap-xs"
                                            >
                                                <span className="material-symbols-outlined text-sm">download</span>
                                                <span className="font-caption">Download</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InvoiceGenerator;
