import React, { useState, useEffect } from 'react';

function ContactSettingsManager() {
    const [settings, setSettings] = useState({
        contact_email: '',
        contact_phone: '',
        contact_location: '',
        business_hours_weekday: '',
        business_hours_saturday: '',
        business_hours_sunday: '',
        contact_page_title: '',
        contact_page_subtitle: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/contact-settings');
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching contact settings:', error);
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
            const response = await fetch('/api/admin/contact-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();

            if (data.success) {
                setNotification({ type: 'success', message: 'Contact settings updated successfully!' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                setNotification({ type: 'error', message: 'Failed to update settings' });
            }
        } catch (error) {
            console.error('Error updating contact settings:', error);
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
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary">contact_page</span>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-on-surface">Contact Page Settings</h2>
                    <p className="text-sm text-on-surface-variant">Manage contact information and business hours</p>
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

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contact_page_title" className="block text-sm font-medium text-on-surface mb-2">
                            Page Title
                        </label>
                        <input
                            type="text"
                            id="contact_page_title"
                            name="contact_page_title"
                            value={settings.contact_page_title}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="contact_email" className="block text-sm font-medium text-on-surface mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="contact_email"
                            name="contact_email"
                            value={settings.contact_email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="contact_page_subtitle" className="block text-sm font-medium text-on-surface mb-2">
                        Page Subtitle
                    </label>
                    <textarea
                        id="contact_page_subtitle"
                        name="contact_page_subtitle"
                        value={settings.contact_page_subtitle}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        required
                        maxLength="500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contact_phone" className="block text-sm font-medium text-on-surface mb-2">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            id="contact_phone"
                            name="contact_phone"
                            value={settings.contact_phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="contact_location" className="block text-sm font-medium text-on-surface mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            id="contact_location"
                            name="contact_location"
                            value={settings.contact_location}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                </div>

                <div className="border-t border-outline pt-4">
                    <h3 className="text-lg font-semibold text-on-surface mb-4">Business Hours</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="business_hours_weekday" className="block text-sm font-medium text-on-surface mb-2">
                                Monday - Friday
                            </label>
                            <input
                                type="text"
                                id="business_hours_weekday"
                                name="business_hours_weekday"
                                value={settings.business_hours_weekday}
                                onChange={handleChange}
                                placeholder="9:00 AM - 6:00 PM"
                                className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="business_hours_saturday" className="block text-sm font-medium text-on-surface mb-2">
                                Saturday
                            </label>
                            <input
                                type="text"
                                id="business_hours_saturday"
                                name="business_hours_saturday"
                                value={settings.business_hours_saturday}
                                onChange={handleChange}
                                placeholder="10:00 AM - 4:00 PM"
                                className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="business_hours_sunday" className="block text-sm font-medium text-on-surface mb-2">
                                Sunday
                            </label>
                            <input
                                type="text"
                                id="business_hours_sunday"
                                name="business_hours_sunday"
                                value={settings.business_hours_sunday}
                                onChange={handleChange}
                                placeholder="Closed"
                                className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ContactSettingsManager;
