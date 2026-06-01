import React, { useState, useEffect } from 'react';

function ServicesManager() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        icon: '',
        description: '',
        youtube_video_id: '',
        display_order: 0,
        is_active: true,
        features: ['']
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/admin/services');
            const data = await response.json();
            setServices(data);
        } catch (error) {
            console.error('Error fetching services:', error);
            showNotification('Failed to load services', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanedFeatures = formData.features.filter(f => f.trim() !== '');

        try {
            const url = editingService 
                ? `/api/admin/services/${editingService.id}`
                : '/api/admin/services';
            
            const method = editingService ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    features: cleanedFeatures
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(
                    editingService ? 'Service updated successfully' : 'Service created successfully',
                    'success'
                );
                setShowModal(false);
                resetForm();
                fetchServices();
            } else {
                showNotification(data.message || 'Failed to save service', 'error');
            }
        } catch (error) {
            console.error('Error saving service:', error);
            showNotification('Failed to save service', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this service?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/services/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Service deleted successfully', 'success');
                fetchServices();
            } else {
                showNotification('Failed to delete service', 'error');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            showNotification('Failed to delete service', 'error');
        }
    };

    const openEditModal = (service) => {
        setEditingService(service);
        setFormData({
            title: service.title,
            slug: service.slug,
            icon: service.icon,
            description: service.description,
            youtube_video_id: service.youtube_video_id || '',
            display_order: service.display_order,
            is_active: service.is_active,
            features: service.features.length > 0 ? service.features : ['']
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingService(null);
        setFormData({
            title: '',
            slug: '',
            icon: '',
            description: '',
            youtube_video_id: '',
            display_order: 0,
            is_active: true,
            features: ['']
        });
    };

    const addFeature = () => {
        setFormData({
            ...formData,
            features: [...formData.features, '']
        });
    };

    const removeFeature = (index) => {
        const newFeatures = formData.features.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            features: newFeatures.length > 0 ? newFeatures : ['']
        });
    };

    const updateFeature = (index, value) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = value;
        setFormData({
            ...formData,
            features: newFeatures
        });
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
                        Services Management
                    </h2>
                    <p className="font-body-md text-on-surface-variant">
                        Manage services displayed on the services page with YouTube videos
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-sm"
                >
                    <span className="material-symbols-outlined">add</span>
                    New Service
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {services.map(service => (
                    <div key={service.id} className="bg-primary-container rounded-xl p-md border border-white/5 hover:border-secondary-container/50 transition-all">
                        <div className="flex items-start gap-md mb-md">
                            <div className="bg-secondary-container/20 p-sm rounded-lg">
                                <span className="material-symbols-outlined text-secondary-container text-3xl">
                                    {service.icon}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-xs">
                                    <h3 className="font-title-md text-white">{service.title}</h3>
                                    <div className="flex items-center gap-xs">
                                        <span className={`px-sm py-xs rounded-full font-caption ${service.is_active ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'}`}>
                                            {service.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="px-sm py-xs bg-surface-container rounded-full font-caption text-on-surface-variant">
                                            #{service.display_order}
                                        </span>
                                    </div>
                                </div>
                                <p className="font-caption text-on-surface-variant line-clamp-2 mb-sm">{service.description}</p>
                                {service.youtube_video_id && (
                                    <div className="flex items-center gap-xs mb-sm">
                                        <span className="material-symbols-outlined text-red-500 text-sm">play_circle</span>
                                        <span className="font-caption text-on-surface-variant">Video: {service.youtube_video_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mb-md">
                            <p className="font-caption text-on-surface-variant mb-xs">Features:</p>
                            <ul className="space-y-xs">
                                {service.features.slice(0, 3).map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-xs">
                                        <span className="material-symbols-outlined text-secondary-container text-sm mt-xs">check_circle</span>
                                        <span className="font-caption text-on-surface-variant">{feature}</span>
                                    </li>
                                ))}
                                {service.features.length > 3 && (
                                    <li className="font-caption text-on-surface-variant italic">+{service.features.length - 3} more</li>
                                )}
                            </ul>
                        </div>
                        <div className="flex gap-sm pt-sm border-t border-white/5">
                            <button
                                onClick={() => openEditModal(service)}
                                className="flex-1 bg-secondary-container text-on-secondary-container px-md py-sm rounded-lg font-label-md hover:opacity-90 transition-all flex items-center justify-center gap-xs"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(service.id)}
                                className="bg-red-500/20 text-red-400 px-md py-sm rounded-lg font-label-md hover:bg-red-500/30 transition-all flex items-center justify-center gap-xs"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {services.length === 0 && (
                <div className="text-center py-xl text-on-surface-variant">
                    No services found. Create your first one.
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md overflow-y-auto">
                    <div className="bg-surface-container rounded-xl p-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-lg">
                            <h3 className="font-headline-md text-white">
                                {editingService ? 'Edit Service' : 'New Service'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-on-surface-variant hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-md">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">Slug *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.slug}
                                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                        placeholder="procurement"
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">Description *</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="3"
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">Material Icon Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.icon}
                                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                                        placeholder="shopping_cart_checkout"
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                    <p className="font-caption text-on-surface-variant mt-xs">
                                        <a href="https://fonts.google.com/icons" target="_blank" className="text-secondary-container underline">Browse icons</a>
                                    </p>
                                </div>
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">YouTube Video ID</label>
                                    <input
                                        type="text"
                                        value={formData.youtube_video_id}
                                        onChange={(e) => setFormData({...formData, youtube_video_id: e.target.value})}
                                        placeholder="dQw4w9WgXcQ"
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                    <p className="font-caption text-on-surface-variant mt-xs">From youtube.com/watch?v=<strong>VIDEO_ID</strong></p>
                                </div>
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">Features</label>
                                <div className="space-y-sm">
                                    {formData.features.map((feature, index) => (
                                        <div key={index} className="flex gap-sm">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => updateFeature(index, e.target.value)}
                                                placeholder="Feature description"
                                                className="flex-1 bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFeature(index)}
                                                className="bg-red-500/20 text-red-400 px-md py-sm rounded-lg hover:bg-red-500/30 transition-all"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addFeature}
                                    className="mt-sm bg-surface-container-highest text-on-surface px-md py-sm rounded-lg font-label-md hover:bg-surface-container-high transition-all flex items-center gap-xs"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Add Feature
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
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
                                        resetForm();
                                    }}
                                    className="px-lg py-sm rounded-lg font-bold text-on-surface-variant hover:bg-surface-container transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg font-bold hover:opacity-90 transition-all"
                                >
                                    {editingService ? 'Update Service' : 'Create Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ServicesManager;
