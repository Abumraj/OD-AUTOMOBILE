import React, { useState, useEffect } from 'react';

function SMSTemplatesManager() {
    const [templates, setTemplates] = useState([]);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [testPhone, setTestPhone] = useState('');
    const [sendingTest, setSendingTest] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/admin/sms-templates', {
                credentials: 'include'
            });
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching SMS templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate({...template, variables: JSON.parse(template.variables || '[]')});
        setShowModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`/api/admin/sms-templates/${editingTemplate.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: editingTemplate.name,
                    message: editingTemplate.message,
                    is_active: editingTemplate.is_active
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('SMS template updated successfully!');
                fetchTemplates();
                setShowModal(false);
                setEditingTemplate(null);
            }
        } catch (error) {
            console.error('Error updating template:', error);
            alert('Failed to update template');
        }
    };

    const handleSendTest = async (templateId) => {
        if (!testPhone) {
            alert('Please enter a test phone number');
            return;
        }

        setSendingTest(true);

        try {
            const response = await fetch(`/api/admin/sms-templates/${templateId}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ test_phone: testPhone })
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
            } else {
                alert(result.message || 'Failed to send test SMS');
            }
        } catch (error) {
            console.error('Error sending test SMS:', error);
            alert('Failed to send test SMS');
        } finally {
            setSendingTest(false);
        }
    };

    const getTypeColor = (type) => {
        const colors = {
            shipment: 'bg-blue-500/20 text-blue-400',
            quote: 'bg-green-500/20 text-green-400',
            auction: 'bg-purple-500/20 text-purple-400',
            contact: 'bg-yellow-500/20 text-yellow-400',
            general: 'bg-gray-500/20 text-gray-400'
        };
        return colors[type] || colors.general;
    };

    const getCharacterCount = (message) => {
        const count = message.length;
        const smsCount = Math.ceil(count / 160);
        return { count, smsCount };
    };

    if (loading) {
        return (
            <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                <div className="animate-pulse">Loading SMS templates...</div>
            </div>
        );
    }

    return (
        <div className="space-y-md">
            <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                <div className="flex items-center justify-between mb-lg">
                    <div>
                        <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
                            SMS Templates
                        </h2>
                        <p className="font-body-md text-on-surface-variant">
                            Manage SMS templates for all platform notifications via Termii
                        </p>
                    </div>
                </div>

                {/* Test Phone Input */}
                <div className="mb-lg p-md bg-surface-container-low rounded-lg border border-white/5">
                    <label className="block font-label-md text-on-surface-variant mb-xs">
                        Test Phone Number
                    </label>
                    <div className="flex gap-sm">
                        <input
                            type="tel"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            placeholder="+2348123456789 or 08123456789"
                            className="flex-1 bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                        />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-xs">
                        Enter a phone number to receive test SMS. Format: +234XXXXXXXXXX or 0XXXXXXXXXX
                    </p>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    {templates.map((template) => {
                        const { count, smsCount } = getCharacterCount(template.message);
                        return (
                            <div key={template.id} className="bg-surface-container-low p-md rounded-lg border border-white/5 hover:border-secondary-container/30 transition-all">
                                <div className="flex items-start justify-between mb-sm">
                                    <div>
                                        <h3 className="font-title-md text-white mb-xs">{template.name}</h3>
                                        <span className={`inline-block px-sm py-xs rounded-full text-xs font-bold uppercase ${getTypeColor(template.type)}`}>
                                            {template.type}
                                        </span>
                                    </div>
                                    <span className={`px-sm py-xs rounded-full text-xs ${
                                        template.is_active 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                        {template.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="mb-md">
                                    <p className="text-sm text-on-surface-variant mb-xs line-clamp-3">
                                        {template.message}
                                    </p>
                                    <div className="flex items-center gap-md text-xs text-on-surface-variant mt-xs">
                                        <span>{count} characters</span>
                                        <span>•</span>
                                        <span>{smsCount} SMS</span>
                                    </div>
                                </div>

                                <div className="flex gap-sm">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="flex-1 bg-secondary-container/20 text-secondary-container px-md py-sm rounded-lg font-bold hover:bg-secondary-container/30 transition-all"
                                    >
                                        Edit Template
                                    </button>
                                    <button
                                        onClick={() => handleSendTest(template.id)}
                                        disabled={!testPhone || sendingTest}
                                        className="px-md py-sm rounded-lg font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Send test SMS"
                                    >
                                        <span className="material-symbols-outlined text-lg">send</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            {showModal && editingTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md overflow-y-auto">
                    <div className="bg-surface-container rounded-xl p-lg max-w-3xl w-full my-md">
                        <div className="flex items-center justify-between mb-lg">
                            <h3 className="font-headline-md text-white">Edit SMS Template</h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingTemplate(null);
                                }}
                                className="text-on-surface-variant hover:text-white"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-md">
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Template Name
                                </label>
                                <input
                                    type="text"
                                    value={editingTemplate.name}
                                    onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    SMS Message
                                </label>
                                <textarea
                                    value={editingTemplate.message}
                                    onChange={(e) => setEditingTemplate({...editingTemplate, message: e.target.value})}
                                    rows="6"
                                    maxLength="500"
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    required
                                ></textarea>
                                <div className="flex justify-between text-xs text-on-surface-variant mt-xs">
                                    <span>Use variables like {'{'}{'{'} customer_name {'}'}{'}'}  or {'{'}{'{'} tracking_number {'}'}{'}'}  </span>
                                    <span>{editingTemplate.message.length}/500 chars ({Math.ceil(editingTemplate.message.length / 160)} SMS)</span>
                                </div>
                            </div>

                            {/* Available Variables */}
                            {editingTemplate.variables && editingTemplate.variables.length > 0 && (
                                <div className="bg-surface-container-low p-md rounded-lg border border-white/5">
                                    <p className="font-label-md text-on-surface-variant mb-sm">Available Variables:</p>
                                    <div className="flex flex-wrap gap-xs">
                                        {editingTemplate.variables.map((variable, index) => (
                                            <code key={index} className="bg-surface-container-lowest px-sm py-xs rounded text-xs text-secondary-container">
                                                {'{'}{'{'} {variable} {'}'}{'}'} 
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-surface-container-low p-md rounded-lg border-l-4 border-secondary-container">
                                <p className="text-sm text-on-surface-variant">
                                    <strong className="text-white">SMS Best Practices:</strong><br/>
                                    • Keep messages under 160 characters when possible (1 SMS)<br/>
                                    • Include company name for identification<br/>
                                    • Use clear, concise language<br/>
                                    • Include relevant tracking/reference numbers<br/>
                                    • Avoid special characters that may not display correctly
                                </p>
                            </div>

                            <div className="flex items-center gap-sm">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={editingTemplate.is_active}
                                    onChange={(e) => setEditingTemplate({...editingTemplate, is_active: e.target.checked})}
                                    className="w-5 h-5"
                                />
                                <label htmlFor="is_active" className="font-label-md text-white cursor-pointer">
                                    Template is active
                                </label>
                            </div>

                            <div className="flex justify-end gap-md pt-md border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingTemplate(null);
                                    }}
                                    className="px-lg py-sm rounded-lg font-bold text-on-surface-variant hover:bg-surface-container transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all"
                                >
                                    Update Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SMSTemplatesManager;
