import React, { useState, useEffect } from 'react';

function DockReceiptGenerator({ shipment, onClose, onGenerated }) {
    const [loading, setLoading] = useState(false);
    const [receipts, setReceipts] = useState([]);
    const [loadingReceipts, setLoadingReceipts] = useState(true);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        stage: shipment?.status || 'shipping',
        date_received: new Date().toISOString().split('T')[0],
        location_received: '',
        notes: '',
        send_email: false
    });

    useEffect(() => {
        if (shipment) {
            setFormData(prev => ({
                ...prev,
                location_received: `${shipment.origin_port || ''}, ${shipment.origin_country || ''}`.trim().replace(/^,\s*|,\s*$/g, '')
            }));
            fetchReceipts();
        }
    }, [shipment]);

    const fetchReceipts = async () => {
        try {
            const response = await fetch(`/api/admin/shipments/${shipment.id}/dock-receipts`);
            const data = await response.json();
            setReceipts(data);
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setLoadingReceipts(false);
        }
    };

    const handlePreview = async () => {
        try {
            // Create form data without send_email for preview
            const previewData = {
                stage: formData.stage,
                date_received: formData.date_received,
                location_received: formData.location_received,
                notes: formData.notes
            };

            // Open preview in new window
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/api/admin/shipments/${shipment.id}/dock-receipt/preview`;
            form.target = '_blank';

            // Add CSRF token and data
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.content || '';
            form.appendChild(csrfInput);

            // Add form data as JSON
            Object.keys(previewData).forEach(key => {
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
            console.error('Error previewing receipt:', error);
            showNotification('Failed to preview receipt', 'error');
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/admin/shipments/${shipment.id}/dock-receipt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(data.message || 'Dock receipt generated successfully', 'success');
                fetchReceipts();
                if (onGenerated) onGenerated(data);
                
                // Auto-download the receipt
                setTimeout(() => {
                    handleDownload(data.receipt_id);
                }, 500);
            } else {
                showNotification(data.error || 'Failed to generate receipt', 'error');
            }
        } catch (error) {
            console.error('Error generating receipt:', error);
            showNotification('Failed to generate receipt', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (receiptId) => {
        try {
            const response = await fetch(`/api/admin/dock-receipts/${receiptId}/download`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dock-receipt-${receiptId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading receipt:', error);
            showNotification('Failed to download receipt', 'error');
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const getStageLabel = (stage) => {
        const stages = {
            pending: 'Pending Processing',
            auction_won: 'Auction Won',
            documentation: 'Documentation',
            shipping: 'Ready for Shipping',
            in_transit: 'In Transit',
            customs: 'Customs Clearance',
            delivered: 'Delivered'
        };
        return stages[stage] || stage;
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
                            <span className="material-symbols-outlined text-secondary-container">receipt_long</span>
                            Dock Receipt Generator
                        </h3>
                        <p className="font-body-sm text-on-surface-variant mt-xs">
                            Generate official dock receipt for {shipment?.reference_number}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                    <div>
                        <h4 className="font-title-md text-white mb-md">Generate New Receipt</h4>
                        <form onSubmit={handleGenerate} className="space-y-md">
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Shipment Stage *
                                </label>
                                <select
                                    required
                                    value={formData.stage}
                                    onChange={(e) => setFormData({...formData, stage: e.target.value})}
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                >
                                    <option value="pending">Pending Processing</option>
                                    <option value="auction_won">Auction Won</option>
                                    <option value="documentation">Documentation</option>
                                    <option value="shipping">Ready for Shipping</option>
                                    <option value="in_transit">In Transit</option>
                                    <option value="customs">Customs Clearance</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                                <p className="font-caption text-on-surface-variant mt-xs">
                                    Select the current stage of the shipment
                                </p>
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Date Received *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date_received}
                                    onChange={(e) => setFormData({...formData, date_received: e.target.value})}
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Location Received *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location_received}
                                    onChange={(e) => setFormData({...formData, location_received: e.target.value})}
                                    placeholder="e.g., Baltimore Port, USA"
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    rows="3"
                                    placeholder="Any additional information for the receipt..."
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                ></textarea>
                            </div>

                            <div className="bg-surface-container-low rounded-lg p-md border border-white/10">
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.send_email}
                                        onChange={(e) => setFormData({...formData, send_email: e.target.checked})}
                                        className="w-5 h-5 rounded border-outline accent-secondary-container"
                                    />
                                    <div className="flex-1">
                                        <div className="font-label-md text-white flex items-center gap-xs">
                                            <span className="material-symbols-outlined text-sm text-secondary-container">email</span>
                                            Send receipt to customer email
                                        </div>
                                        <div className="font-caption text-on-surface-variant mt-xs">
                                            {shipment?.customer_email ? (
                                                <>Email will be sent to: <span className="text-white">{shipment.customer_email}</span></>
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
                                            <span className="material-symbols-outlined">{formData.send_email ? 'send' : 'receipt_long'}</span>
                                            {formData.send_email ? 'Generate & Email' : 'Generate'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div>
                        <h4 className="font-title-md text-white mb-md">Previous Receipts</h4>
                        {loadingReceipts ? (
                            <div className="text-center py-lg text-on-surface-variant">
                                <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
                            </div>
                        ) : receipts.length === 0 ? (
                            <div className="bg-surface-container-low rounded-lg p-lg text-center">
                                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-sm">receipt_long</span>
                                <p className="font-body-md text-on-surface-variant">
                                    No receipts generated yet
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-sm max-h-[500px] overflow-y-auto">
                                {receipts.map(receipt => (
                                    <div
                                        key={receipt.id}
                                        className="bg-surface-container-low rounded-lg p-md border border-white/5 hover:border-secondary-container/50 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-sm">
                                            <div className="flex-1">
                                                <div className="font-label-md text-white mb-xs">
                                                    {receipt.receipt_number}
                                                </div>
                                                <div className="flex items-center gap-xs mb-xs">
                                                    <span className="material-symbols-outlined text-secondary-container text-sm">local_shipping</span>
                                                    <span className="font-caption text-on-surface-variant">
                                                        {receipt.stage_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-xs">
                                                    <span className="material-symbols-outlined text-on-surface-variant text-sm">calendar_today</span>
                                                    <span className="font-caption text-on-surface-variant">
                                                        {new Date(receipt.date_received).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(receipt.id)}
                                                className="bg-secondary-container/20 text-secondary-container px-sm py-xs rounded-lg hover:bg-secondary-container/30 transition-all flex items-center gap-xs"
                                            >
                                                <span className="material-symbols-outlined text-sm">download</span>
                                                <span className="font-caption">Download</span>
                                            </button>
                                        </div>
                                        {receipt.location_received && (
                                            <div className="flex items-center gap-xs mt-sm pt-sm border-t border-white/5">
                                                <span className="material-symbols-outlined text-on-surface-variant text-sm">location_on</span>
                                                <span className="font-caption text-on-surface-variant">
                                                    {receipt.location_received}
                                                </span>
                                            </div>
                                        )}
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

export default DockReceiptGenerator;
