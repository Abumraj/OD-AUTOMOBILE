import React, { useState, useEffect } from 'react';

function PerformanceSettingsManager() {
    const [deliveredCount, setDeliveredCount] = useState('100');
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/performance-settings');
            const data = await response.json();
            setDeliveredCount(data.delivered_cars_count || '100');
        } catch (error) {
            console.error('Error fetching performance settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/admin/performance-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    delivered_cars_count: deliveredCount
                })
            });

            const data = await response.json();

            if (data.success) {
                setNotification({ type: 'success', message: 'Performance settings updated successfully!' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                setNotification({ type: 'error', message: 'Failed to update settings' });
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            setNotification({ type: 'error', message: 'Failed to update settings' });
        }
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

            <div className="mb-lg">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-xs flex items-center gap-sm">
                    <span className="material-symbols-outlined">analytics</span>
                    Performance Counter
                </h2>
                <p className="font-body-md text-on-surface-variant">
                    Manage the number of successfully delivered cars displayed on the homepage
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-md">
                <div>
                    <label className="block font-label-md text-on-surface-variant mb-xs">
                        Number of Cars Delivered
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={deliveredCount}
                        onChange={(e) => setDeliveredCount(e.target.value)}
                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                        placeholder="100"
                    />
                    <p className="font-caption text-on-surface-variant mt-xs">
                        This number will be displayed on the homepage: "{deliveredCount}+ Cars Successfully Delivered Across Africa"
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-sm"
                    >
                        <span className="material-symbols-outlined">save</span>
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

export default PerformanceSettingsManager;
