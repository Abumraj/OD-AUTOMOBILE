import React, { useState, useEffect } from 'react';

function TermiiSettingsManager() {
    const [settings, setSettings] = useState({
        api_key: '',
        sender_id: 'OD Auto',
        channel: 'generic',
        enabled: false
    });
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [checkingBalance, setCheckingBalance] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/termii-settings', {
                credentials: 'include'
            });
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching Termii settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/admin/termii-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(settings)
            });

            const result = await response.json();

            if (result.success) {
                alert('Termii settings updated successfully!');
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

    const checkBalance = async () => {
        setCheckingBalance(true);

        try {
            const response = await fetch('/api/admin/termii-balance', {
                credentials: 'include'
            });
            const result = await response.json();

            if (result.success) {
                setBalance(result);
            } else {
                alert(result.message || 'Failed to fetch balance');
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            alert('Failed to fetch balance');
        } finally {
            setCheckingBalance(false);
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
            <div className="flex items-start justify-between mb-lg">
                <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
                        Termii SMS Settings
                    </h2>
                    <p className="font-body-md text-on-surface-variant">
                        Configure Termii API for SMS notifications
                    </p>
                </div>
                {balance && (
                    <div className="bg-surface-container-low px-lg py-md rounded-lg border border-secondary-container/30">
                        <p className="text-xs text-on-surface-variant mb-xs">Account Balance</p>
                        <p className="font-headline-sm text-secondary-container">
                            {balance.currency} {parseFloat(balance.balance).toFixed(2)}
                        </p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-md">
                <div className="bg-surface-container-low p-md rounded-lg border-l-4 border-secondary-container">
                    <p className="text-sm text-on-surface-variant mb-sm">
                        <strong className="text-white">Getting Started with Termii:</strong>
                    </p>
                    <ol className="text-sm text-on-surface-variant space-y-xs list-decimal list-inside">
                        <li>Sign up at <a href="https://termii.com" target="_blank" rel="noopener noreferrer" className="text-secondary-container hover:underline">termii.com</a></li>
                        <li>Verify your account and add funds</li>
                        <li>Get your API key from the dashboard</li>
                        <li>Register a sender ID (must be approved)</li>
                        <li>Enter your credentials below and enable SMS</li>
                    </ol>
                </div>

                <div>
                    <label className="block font-label-md text-on-surface-variant mb-xs">
                        API Key *
                    </label>
                    <input
                        type="password"
                        value={settings.api_key}
                        onChange={(e) => setSettings({...settings, api_key: e.target.value})}
                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container font-mono"
                        placeholder="Enter your Termii API key"
                        required
                    />
                    <p className="text-xs text-on-surface-variant mt-xs">
                        Your Termii API key from the dashboard
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                        <label className="block font-label-md text-on-surface-variant mb-xs">
                            Sender ID *
                        </label>
                        <input
                            type="text"
                            value={settings.sender_id}
                            onChange={(e) => setSettings({...settings, sender_id: e.target.value.slice(0, 11)})}
                            maxLength="11"
                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                            placeholder="OD Auto"
                            required
                        />
                        <p className="text-xs text-on-surface-variant mt-xs">
                            Max 11 characters (must be registered with Termii)
                        </p>
                    </div>

                    <div>
                        <label className="block font-label-md text-on-surface-variant mb-xs">
                            Channel *
                        </label>
                        <select
                            value={settings.channel}
                            onChange={(e) => setSettings({...settings, channel: e.target.value})}
                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                            required
                        >
                            <option value="generic">Generic</option>
                            <option value="dnd">DND (Do Not Disturb)</option>
                            <option value="whatsapp">WhatsApp</option>
                        </select>
                        <p className="text-xs text-on-surface-variant mt-xs">
                            Message delivery channel
                        </p>
                    </div>
                </div>

                <div className="bg-surface-container-low p-md rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="flex items-center gap-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.enabled}
                                    onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
                                    className="w-5 h-5"
                                />
                                <span className="font-label-md text-white">Enable SMS Notifications</span>
                            </label>
                            <p className="text-xs text-on-surface-variant mt-xs ml-7">
                                When enabled, SMS will be sent for configured events
                            </p>
                        </div>
                        <span className={`px-md py-sm rounded-full text-sm font-bold ${
                            settings.enabled 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-gray-500/20 text-gray-400'
                        }`}>
                            {settings.enabled ? 'Active' : 'Disabled'}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-md border-t border-white/10">
                    <button
                        type="button"
                        onClick={checkBalance}
                        disabled={checkingBalance || !settings.api_key}
                        className="bg-surface-container-high text-on-surface px-lg py-sm rounded-lg font-bold hover:bg-surface-container-highest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-sm"
                    >
                        <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                        {checkingBalance ? 'Checking...' : 'Check Balance'}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>

            {/* SMS Pricing Info */}
            <div className="mt-lg pt-lg border-t border-white/10">
                <h3 className="font-title-md text-white mb-md">SMS Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                    <div className="bg-surface-container-low p-md rounded-lg">
                        <p className="text-xs text-on-surface-variant mb-xs">Local SMS (Nigeria)</p>
                        <p className="font-title-lg text-white">₦2.50 - ₦4.00</p>
                        <p className="text-xs text-on-surface-variant mt-xs">Per SMS (160 chars)</p>
                    </div>
                    <div className="bg-surface-container-low p-md rounded-lg">
                        <p className="text-xs text-on-surface-variant mb-xs">International SMS</p>
                        <p className="font-title-lg text-white">₦10 - ₦50</p>
                        <p className="text-xs text-on-surface-variant mt-xs">Varies by country</p>
                    </div>
                    <div className="bg-surface-container-low p-md rounded-lg">
                        <p className="text-xs text-on-surface-variant mb-xs">Character Limit</p>
                        <p className="font-title-lg text-white">160 chars</p>
                        <p className="text-xs text-on-surface-variant mt-xs">Per single SMS</p>
                    </div>
                </div>
                <p className="text-xs text-on-surface-variant mt-md">
                    * Prices are approximate and may vary. Check Termii dashboard for current rates.
                </p>
            </div>
        </div>
    );
}

export default TermiiSettingsManager;
