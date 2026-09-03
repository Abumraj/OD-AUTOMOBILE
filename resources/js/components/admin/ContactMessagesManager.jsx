import React, { useState, useEffect } from 'react';
import { useConfirmation } from './ConfirmationProvider';
import { exportToCSV } from '../../utils/csvExport';

function ContactMessagesManager() {
    const { confirm } = useConfirmation();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [filter, setFilter] = useState('all');
    const [notification, setNotification] = useState(null);

    const handleExportCSV = () => {
        const filteredMessages = filter === 'all' ? messages : messages.filter(m => m.status === filter);
        const exportData = filteredMessages.map(message => ({
            'Name': message.name,
            'Email': message.email,
            'Phone': message.phone || '',
            'Service': message.service,
            'Message': message.message,
            'Status': message.status,
            'Admin Notes': message.admin_notes || '',
            'Submitted': message.created_at
        }));
        
        const filename = `contact_messages_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
        setNotification({ type: 'success', message: 'Messages exported successfully!' });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/admin/contact-messages');
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching contact messages:', error);
            setNotification({ type: 'error', message: 'Failed to load messages' });
        } finally {
            setLoading(false);
        }
    };

    const updateMessageStatus = async (id, status, adminNotes = '') => {
        try {
            const response = await fetch(`/api/admin/contact-messages/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status, admin_notes: adminNotes })
            });

            const data = await response.json();

            if (data.success) {
                setNotification({ type: 'success', message: 'Status updated successfully!' });
                setTimeout(() => setNotification(null), 3000);
                fetchMessages();
                setSelectedMessage(null);
            }
        } catch (error) {
            console.error('Error updating message status:', error);
            setNotification({ type: 'error', message: 'Failed to update status' });
        }
    };

    const deleteMessage = async (id) => {
        if (!await confirm('Are you sure you want to delete this message?')) return;

        try {
            const response = await fetch(`/api/admin/contact-messages/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                setNotification({ type: 'success', message: 'Message deleted successfully!' });
                setTimeout(() => setNotification(null), 3000);
                fetchMessages();
                setSelectedMessage(null);
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            setNotification({ type: 'error', message: 'Failed to delete message' });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'read': return 'bg-yellow-100 text-yellow-800';
            case 'replied': return 'bg-green-100 text-green-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredMessages = messages.filter(msg => {
        if (filter === 'all') return true;
        return msg.status === filter;
    });

    const statusCounts = {
        all: messages.length,
        new: messages.filter(m => m.status === 'new').length,
        read: messages.filter(m => m.status === 'read').length,
        replied: messages.filter(m => m.status === 'replied').length,
        archived: messages.filter(m => m.status === 'archived').length
    };

    if (loading) {
        return (
            <div className="bg-surface-container rounded-xl p-gutter">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container rounded-xl p-gutter">
            <div className="flex items-center justify-between mb-gutter">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary">mail</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-on-surface">Contact Messages</h2>
                        <p className="text-sm text-on-surface-variant">Manage customer inquiries</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="bg-surface-container-high text-on-surface px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 border border-outline-variant"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export CSV
                    </button>
                    {['all', 'new', 'read', 'replied', 'archived'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1 rounded-lg text-sm transition-all ${
                                filter === status 
                                    ? 'bg-primary text-on-primary' 
                                    : 'bg-surface text-on-surface-variant hover:bg-surface-variant'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
                        </button>
                    ))}
                </div>
            </div>

            {notification && (
                <div className={`mb-4 p-4 rounded-lg ${
                    notification.type === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {notification.message}
                </div>
            )}

            {filteredMessages.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">inbox</span>
                    <p>No messages found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {filteredMessages.map(message => (
                            <div
                                key={message.id}
                                onClick={() => setSelectedMessage(message)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                    selectedMessage?.id === message.id
                                        ? 'border-primary bg-primary/10'
                                        : 'border-outline bg-surface hover:bg-surface-variant'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-on-surface">{message.name}</h3>
                                        <p className="text-sm text-on-surface-variant">{message.email}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(message.status)}`}>
                                        {message.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">phone</span>
                                        {message.phone}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">category</span>
                                        {message.service}
                                    </span>
                                </div>
                                <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">
                                    {message.message || 'No message provided'}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-2">
                                    {new Date(message.created_at).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-surface rounded-lg p-4 border border-outline">
                        {selectedMessage ? (
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-on-surface">{selectedMessage.name}</h3>
                                        <p className="text-sm text-on-surface-variant">{selectedMessage.email}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="text-on-surface-variant hover:text-on-surface"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="text-xs text-on-surface-variant">Phone</label>
                                        <p className="text-on-surface">{selectedMessage.phone}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-on-surface-variant">Service Interested In</label>
                                        <p className="text-on-surface capitalize">{selectedMessage.service}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-on-surface-variant">Message</label>
                                        <p className="text-on-surface whitespace-pre-wrap">
                                            {selectedMessage.message || 'No message provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-on-surface-variant">Received</label>
                                        <p className="text-on-surface">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                                    </div>
                                    {selectedMessage.admin_notes && (
                                        <div>
                                            <label className="text-xs text-on-surface-variant">Admin Notes</label>
                                            <p className="text-on-surface whitespace-pre-wrap">{selectedMessage.admin_notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-outline pt-4">
                                    <label className="text-sm font-medium text-on-surface mb-2 block">Update Status</label>
                                    <div className="flex gap-2 mb-4">
                                        {['new', 'read', 'replied', 'archived'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => updateMessageStatus(selectedMessage.id, status, selectedMessage.admin_notes)}
                                                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                                                    selectedMessage.status === status
                                                        ? 'bg-primary text-on-primary'
                                                        : 'bg-surface-variant text-on-surface hover:bg-primary/20'
                                                }`}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <a
                                            href={`mailto:${selectedMessage.email}`}
                                            className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 active:scale-95 transition-all text-center"
                                        >
                                            Reply via Email
                                        </a>
                                        <button
                                            onClick={() => deleteMessage(selectedMessage.id)}
                                            className="px-4 py-2 bg-error text-on-error rounded-lg hover:bg-error/90 active:scale-95 transition-all"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-on-surface-variant">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-6xl mb-4 block opacity-50">mail</span>
                                    <p>Select a message to view details</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ContactMessagesManager;
