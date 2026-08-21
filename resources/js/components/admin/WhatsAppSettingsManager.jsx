import React, { useState, useEffect } from 'react';

function WhatsAppSettingsManager() {
    const [settings, setSettings] = useState({
        phone: '',
        message: '',
        enabled: false,
        access_token: '',
        phone_number_id: '',
        api_version: 'v20.0'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/whatsapp-settings');
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching WhatsApp settings:', error);
            setNotification({ type: 'error', message: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setNotification(null);

        try {
            const response = await fetch('/api/admin/whatsapp-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();

            if (data.success) {
                setNotification({ type: 'success', message: 'WhatsApp settings updated successfully!' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                setNotification({ type: 'error', message: 'Failed to update settings' });
            }
        } catch (error) {
            console.error('Error updating WhatsApp settings:', error);
            setNotification({ type: 'error', message: 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
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
            <div className="flex items-center gap-3 mb-gutter">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                    <svg fill="white" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.548 0 10.058-4.51 10.06-10.059 0-2.689-1.047-5.215-2.947-7.115s-4.426-2.945-7.114-2.945c-5.549 0-10.059 4.51-10.061 10.059-.001 2.224.637 4.393 1.83 6.256l-1.093 3.993 4.144-1.086c.001-.001.001-.001.001-.001zm11.367-7.635c-.31-.155-1.837-.906-2.121-1.01-.284-.104-.49-.155-.698.156-.206.311-.798 1.01-.978 1.218-.18.208-.36.233-.67.078-.31-.155-1.308-.482-2.491-1.538-.919-.819-1.54-1.831-1.72-2.142-.18-.311-.019-.479.136-.633l.453-.527c.15-.174.2-.299.3-.499.1-.2.05-.375-.025-.53-.075-.156-.698-1.685-.956-2.307-.251-.605-.506-.523-.698-.533l-.596-.011c-.206 0-.542.077-.826.388-.284.311-1.085 1.062-1.085 2.592 0 1.53 1.111 3.01 1.266 3.218.155.207 2.186 3.339 5.297 4.682.74.32 1.317.51 1.767.653.743.236 1.419.203 1.953.123.595-.089 1.837-.751 2.096-1.478.258-.727.258-1.348.181-1.477-.077-.13-.284-.207-.594-.362z"></path>
                    </svg>
                </div>
                <div>
                    <label className="flex items-center gap-3 text-sm font-medium text-on-surface mb-2">
                        <input
                            type="checkbox"
                            name="enabled"
                            checked={settings.enabled}
                            onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                            className="w-5 h-5"
                        />
                        Enable automated WhatsApp notifications
                    </label>
                    <p className="mt-1 mb-4 text-xs text-on-surface-variant">
                        Controls WhatsApp messages and document attachments sent by the system.
                    </p>
                </div>

                <div>
                    <label htmlFor="access_token" className="block text-sm font-medium text-on-surface mb-2">
                        WhatsApp Cloud API Access Token
                    </label>
                    <input
                        type="password"
                        id="access_token"
                        name="access_token"
                        value={settings.access_token}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        autoComplete="off"
                    />
                </div>

                <div>
                    <label htmlFor="phone_number_id" className="block text-sm font-medium text-on-surface mb-2">
                        WhatsApp Phone Number ID
                    </label>
                    <input
                        type="text"
                        id="phone_number_id"
                        name="phone_number_id"
                        value={settings.phone_number_id}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-on-surface">WhatsApp Settings</h2>
                    <p className="text-sm text-on-surface-variant">Configure WhatsApp contact button</p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-on-surface mb-2">
                        Phone Number (with country code)
                    </label>
                    <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={settings.phone}
                        onChange={handleChange}
                        placeholder="e.g., 1234567890 or +1234567890"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                    <p className="mt-1 text-xs text-on-surface-variant">
                        Enter phone number without spaces or special characters (except +)
                    </p>
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-on-surface mb-2">
                        Default Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        value={settings.message}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Enter the default message users will send"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        required
                        maxLength="500"
                    />
                    <p className="mt-1 text-xs text-on-surface-variant">
                        {settings.message.length}/500 characters
                    </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                    
                    {settings.phone && (
                        <a
                            href={`https://wa.me/${settings.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(settings.message)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] active:scale-95 transition-all"
                        >
                            Test WhatsApp Link
                        </a>
                    )}
                </div>
            </form>
        </div>
    );
}

export default WhatsAppSettingsManager;
