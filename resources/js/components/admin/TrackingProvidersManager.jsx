import React, { useState, useEffect } from 'react';

function TrackingProvidersManager() {
    const [settings, setSettings] = useState({
        tracking_grimaldi_enabled: 'true',
        tracking_grimaldi_url: '',
        tracking_grimaldi_name: '',
        tracking_sallaum_enabled: 'true',
        tracking_sallaum_url: '',
        tracking_sallaum_name: '',
        tracking_internal_enabled: 'true'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/tracking-settings');
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching tracking settings:', error);
            showNotification('Failed to load tracking settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/admin/tracking-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Tracking settings updated successfully', 'success');
            } else {
                showNotification(data.message || 'Failed to update settings', 'error');
            }
        } catch (error) {
            console.error('Error updating tracking settings:', error);
            showNotification('Failed to update tracking settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    if (loading) {
        return (
            <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                <div className="animate-pulse space-y-md">
                    <div className="h-6 bg-primary-container rounded w-1/3"></div>
                    <div className="h-4 bg-primary-container rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container rounded-xl p-lg border border-white/10">
            {notification && (
                <div className={`mb-md p-md rounded-lg ${notification.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {notification.message}
                </div>
            )}

            <div className="flex items-center justify-between mb-lg">
                <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
                        Tracking Providers
                    </h2>
                    <p className="font-body-md text-on-surface-variant">
                        Manage external shipping line tracking integrations
                    </p>
                </div>
                <span className="material-symbols-outlined text-secondary-container text-4xl">
                    public
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-lg">
                {/* Grimaldi Lines */}
                <div className="bg-primary-container p-md rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-md">
                        <h3 className="font-title-md text-white">Grimaldi Lines</h3>
                        <label className="flex items-center gap-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.tracking_grimaldi_enabled === 'true'}
                                onChange={(e) => handleChange('tracking_grimaldi_enabled', e.target.checked ? 'true' : 'false')}
                                className="w-5 h-5 rounded bg-surface-container border-white/20 text-secondary-container focus:ring-2 focus:ring-secondary-container"
                            />
                            <span className="font-label-md text-on-surface-variant">Enabled</span>
                        </label>
                    </div>
                    <div className="space-y-sm">
                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={settings.tracking_grimaldi_name || ''}
                                onChange={(e) => handleChange('tracking_grimaldi_name', e.target.value)}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container transition-colors"
                                placeholder="Grimaldi Lines"
                            />
                        </div>
                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Tracking URL
                            </label>
                            <input
                                type="url"
                                value={settings.tracking_grimaldi_url || ''}
                                onChange={(e) => handleChange('tracking_grimaldi_url', e.target.value)}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container transition-colors"
                                placeholder="https://www.gnet.grimaldi-eservice.com/..."
                            />
                        </div>
                    </div>
                </div>

                {/* Sallaum Lines */}
                <div className="bg-primary-container p-md rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-md">
                        <h3 className="font-title-md text-white">Sallaum Lines</h3>
                        <label className="flex items-center gap-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.tracking_sallaum_enabled === 'true'}
                                onChange={(e) => handleChange('tracking_sallaum_enabled', e.target.checked ? 'true' : 'false')}
                                className="w-5 h-5 rounded bg-surface-container border-white/20 text-secondary-container focus:ring-2 focus:ring-secondary-container"
                            />
                            <span className="font-label-md text-on-surface-variant">Enabled</span>
                        </label>
                    </div>
                    <div className="space-y-sm">
                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={settings.tracking_sallaum_name || ''}
                                onChange={(e) => handleChange('tracking_sallaum_name', e.target.value)}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container transition-colors"
                                placeholder="Sallaum Lines"
                            />
                        </div>
                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Tracking URL
                            </label>
                            <input
                                type="url"
                                value={settings.tracking_sallaum_url || ''}
                                onChange={(e) => handleChange('tracking_sallaum_url', e.target.value)}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container transition-colors"
                                placeholder="https://sallaumlines.com/track-shipment/"
                            />
                        </div>
                    </div>
                </div>

                {/* Internal Tracking */}
                <div className="bg-primary-container p-md rounded-lg border border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-title-md text-white mb-xs">Internal Tracking System</h3>
                            <p className="font-body-sm text-on-surface-variant">
                                Show internal tracking search on tracking page
                            </p>
                        </div>
                        <label className="flex items-center gap-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.tracking_internal_enabled === 'true'}
                                onChange={(e) => handleChange('tracking_internal_enabled', e.target.checked ? 'true' : 'false')}
                                className="w-5 h-5 rounded bg-surface-container border-white/20 text-secondary-container focus:ring-2 focus:ring-secondary-container"
                            />
                            <span className="font-label-md text-on-surface-variant">Enabled</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-secondary-container text-on-secondary-container px-xl py-sm rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-sm"
                    >
                        {saving ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default TrackingProvidersManager;
