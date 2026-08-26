import React, { useState, useEffect } from 'react';

function GeneralSettingsManager() {
    const [settings, setSettings] = useState({
        minimum_deposit: '1000',
        office_address: '',
        office_city: '',
        office_country: '',
        office_phone: '',
        office_email: '',
        site_title: '',
        site_description: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/general-settings', {
                credentials: 'include'
            });
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching general settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/admin/general-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(settings)
            });

            const result = await response.json();

            if (result.success) {
                alert('General settings updated successfully!');
            } else {
                alert('Failed to update settings');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container rounded-xl p-lg border border-white/10">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                General Settings
            </h2>
            <p className="font-body-md text-on-surface-variant mb-lg">
                Configure minimum deposit and office contact information
            </p>

            <form onSubmit={handleSubmit} className="space-y-md">
                <div className="border-b border-white/10 pb-md">
                    <h3 className="font-title-md text-white mb-md">Site Identity (Browser Tab & Link Previews)</h3>
                    <div className="space-y-md">
                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Site Title
                            </label>
                            <input
                                type="text"
                                value={settings.site_title}
                                onChange={(e) => setSettings({...settings, site_title: e.target.value})}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                placeholder="OD Automotive & Logistics | Professional Industrial Transport"
                            />
                            <p className="text-xs text-on-surface-variant mt-xs">
                                Shown in the browser tab and as the title when the site is shared on social media or messaging apps
                            </p>
                        </div>
                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Site Description
                            </label>
                            <textarea
                                value={settings.site_description}
                                onChange={(e) => setSettings({...settings, site_description: e.target.value})}
                                rows="2"
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                placeholder="Professional automotive logistics and transport services..."
                            />
                            <p className="text-xs text-on-surface-variant mt-xs">
                                Shown as the description when the site is shared on social media or messaging apps
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block font-label-md text-on-surface-variant mb-xs">
                        Minimum Deposit ($)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={settings.minimum_deposit}
                        onChange={(e) => setSettings({...settings, minimum_deposit: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                        required
                    />
                    <p className="text-xs text-on-surface-variant mt-xs">
                        This amount will be displayed throughout the site where deposit is mentioned
                    </p>
                </div>

                <div className="border-t border-white/10 pt-md">
                    <h3 className="font-title-md text-white mb-md">Office Address</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div className="md:col-span-2">
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Street Address
                            </label>
                            <input
                                type="text"
                                value={settings.office_address}
                                onChange={(e) => setSettings({...settings, office_address: e.target.value})}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                placeholder="123 Main Street"
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                City
                            </label>
                            <input
                                type="text"
                                value={settings.office_city}
                                onChange={(e) => setSettings({...settings, office_city: e.target.value})}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                placeholder="New York"
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Country
                            </label>
                            <input
                                type="text"
                                value={settings.office_country}
                                onChange={(e) => setSettings({...settings, office_country: e.target.value})}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                placeholder="United States"
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={settings.office_phone}
                                onChange={(e) => setSettings({...settings, office_phone: e.target.value})}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={settings.office_email}
                                onChange={(e) => setSettings({...settings, office_email: e.target.value})}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                placeholder="office@odautomotive.com"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-md border-t border-white/10">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default GeneralSettingsManager;
