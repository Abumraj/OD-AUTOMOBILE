import React, { useState, useEffect } from 'react';

function HomepageServicesManager() {
    const [services, setServices] = useState([]);
    const [sectionSettings, setSectionSettings] = useState({
        title: '',
        subtitle: '',
        description: ''
    });
    const [editingService, setEditingService] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/admin/homepage-services', {
                credentials: 'include'
            });
            const data = await response.json();
            setServices(data.services);
            setSectionSettings({
                title: data.title,
                subtitle: data.subtitle,
                description: data.description
            });
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleServiceUpdate = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`/api/admin/homepage-services/${editingService.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(editingService)
            });

            const result = await response.json();

            if (result.success) {
                alert('Service updated successfully!');
                fetchServices();
                setShowModal(false);
                setEditingService(null);
            }
        } catch (error) {
            console.error('Error updating service:', error);
            alert('Failed to update service');
        }
    };

    const handleSectionUpdate = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/admin/homepage-services-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(sectionSettings)
            });

            const result = await response.json();

            if (result.success) {
                alert('Section settings updated successfully!');
            }
        } catch (error) {
            console.error('Error updating section settings:', error);
            alert('Failed to update section settings');
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
        <div className="space-y-md">
            {/* Section Settings */}
            <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                    Services Section Settings
                </h2>
                <form onSubmit={handleSectionUpdate} className="space-y-md">
                    <div>
                        <label className="block font-label-md text-on-surface-variant mb-xs">
                            Section Subtitle
                        </label>
                        <input
                            type="text"
                            value={sectionSettings.subtitle}
                            onChange={(e) => setSectionSettings({...sectionSettings, subtitle: e.target.value})}
                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-label-md text-on-surface-variant mb-xs">
                            Section Title
                        </label>
                        <input
                            type="text"
                            value={sectionSettings.title}
                            onChange={(e) => setSectionSettings({...sectionSettings, title: e.target.value})}
                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-label-md text-on-surface-variant mb-xs">
                            Section Description
                        </label>
                        <textarea
                            value={sectionSettings.description}
                            onChange={(e) => setSectionSettings({...sectionSettings, description: e.target.value})}
                            rows="3"
                            className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                            required
                        ></textarea>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all"
                        >
                            Update Section Settings
                        </button>
                    </div>
                </form>
            </div>

            {/* Services List */}
            <div className="bg-surface-container rounded-xl p-lg border border-white/10">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-md">
                    Services
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    {services.map((service) => (
                        <div key={service.id} className="bg-surface-container-low p-md rounded-lg border border-white/5">
                            <div className="flex items-start justify-between mb-sm">
                                <div className="flex items-center gap-sm">
                                    <span className="material-symbols-outlined text-secondary-container text-2xl">
                                        {service.icon}
                                    </span>
                                    <h3 className="font-title-md text-white">{service.title}</h3>
                                </div>
                                <span className={`px-sm py-xs rounded-full text-xs ${
                                    service.is_active 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                    {service.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-on-surface-variant text-sm mb-md">{service.description}</p>
                            <button
                                onClick={() => {
                                    setEditingService(service);
                                    setShowModal(true);
                                }}
                                className="text-secondary-container hover:text-white transition-colors text-sm font-bold"
                            >
                                Edit Service
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Modal */}
            {showModal && editingService && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
                    <div className="bg-surface-container rounded-xl p-lg max-w-2xl w-full">
                        <div className="flex items-center justify-between mb-lg">
                            <h3 className="font-headline-md text-white">Edit Service</h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingService(null);
                                }}
                                className="text-on-surface-variant hover:text-white"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleServiceUpdate} className="space-y-md">
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Icon (Material Symbol)
                                </label>
                                <input
                                    type="text"
                                    value={editingService.icon}
                                    onChange={(e) => setEditingService({...editingService, icon: e.target.value})}
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    required
                                />
                                <p className="text-xs text-on-surface-variant mt-xs">
                                    Visit <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" className="text-secondary-container">Google Material Symbols</a> for icon names
                                </p>
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editingService.title}
                                    onChange={(e) => setEditingService({...editingService, title: e.target.value})}
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Description
                                </label>
                                <textarea
                                    value={editingService.description}
                                    onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                                    rows="4"
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    required
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-md">
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        value={editingService.display_order}
                                        onChange={(e) => setEditingService({...editingService, display_order: parseInt(e.target.value)})}
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        required
                                    />
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center gap-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingService.is_active}
                                            onChange={(e) => setEditingService({...editingService, is_active: e.target.checked})}
                                            className="w-5 h-5"
                                        />
                                        <span className="font-label-md text-white">Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-md pt-md">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingService(null);
                                    }}
                                    className="px-lg py-sm rounded-lg font-bold text-on-surface-variant hover:bg-surface-container transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all"
                                >
                                    Update Service
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomepageServicesManager;
