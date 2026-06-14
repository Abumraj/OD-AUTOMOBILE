import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function SocialMediaSettingsManager() {
    const [settings, setSettings] = useState({
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: '',
        tiktok: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await api.getSocialMediaSettings();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching social media settings:', error);
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
            const data = await api.updateSocialMediaSettings(settings);
            if (data.success) {
                setNotification({ type: 'success', message: 'Social media links updated successfully!' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                setNotification({ type: 'error', message: 'Failed to update settings' });
            }
        } catch (error) {
            console.error('Error updating social media settings:', error);
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
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary">share</span>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-on-surface">Social Media Links</h2>
                    <p className="text-sm text-on-surface-variant">Manage social media links shown in the footer and testimonials</p>
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
                    <label htmlFor="facebook" className="block text-sm font-medium text-on-surface mb-2">
                        Facebook URL
                    </label>
                    <input
                        type="url"
                        id="facebook"
                        name="facebook"
                        value={settings.facebook}
                        onChange={handleChange}
                        placeholder="https://facebook.com/yourpage"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="instagram" className="block text-sm font-medium text-on-surface mb-2">
                        Instagram URL
                    </label>
                    <input
                        type="url"
                        id="instagram"
                        name="instagram"
                        value={settings.instagram}
                        onChange={handleChange}
                        placeholder="https://instagram.com/yourhandle"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="twitter" className="block text-sm font-medium text-on-surface mb-2">
                        Twitter / X URL
                    </label>
                    <input
                        type="url"
                        id="twitter"
                        name="twitter"
                        value={settings.twitter}
                        onChange={handleChange}
                        placeholder="https://twitter.com/yourhandle"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="linkedin" className="block text-sm font-medium text-on-surface mb-2">
                        LinkedIn URL
                    </label>
                    <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        value={settings.linkedin}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/company/yourcompany"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="tiktok" className="block text-sm font-medium text-on-surface mb-2">
                        TikTok URL
                    </label>
                    <input
                        type="url"
                        id="tiktok"
                        name="tiktok"
                        value={settings.tiktok}
                        onChange={handleChange}
                        placeholder="https://tiktok.com/@yourhandle"
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-outline text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Social Links'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SocialMediaSettingsManager;
