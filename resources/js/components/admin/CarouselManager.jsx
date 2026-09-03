import React, { useState, useEffect } from 'react';
import { useConfirmation } from './ConfirmationProvider';

function CarouselManager() {
    const { confirm } = useConfirmation();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image_url: '',
        button_text: '',
        button_link: '',
        display_order: 0,
        is_active: true
    });

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await fetch('/api/admin/carousel');
            const data = await response.json();
            setImages(data);
        } catch (error) {
            console.error('Error fetching carousel images:', error);
            showNotification('Failed to load carousel images', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingImage 
                ? `/api/admin/carousel/${editingImage.id}`
                : '/api/admin/carousel';
            
            const method = editingImage ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(
                    editingImage ? 'Carousel image updated successfully' : 'Carousel image created successfully',
                    'success'
                );
                setShowModal(false);
                resetForm();
                fetchImages();
            } else {
                showNotification(data.message || 'Failed to save carousel image', 'error');
            }
        } catch (error) {
            console.error('Error saving carousel image:', error);
            showNotification('Failed to save carousel image', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!await confirm('Are you sure you want to delete this carousel image?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/carousel/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Carousel image deleted successfully', 'success');
                fetchImages();
            } else {
                showNotification('Failed to delete carousel image', 'error');
            }
        } catch (error) {
            console.error('Error deleting carousel image:', error);
            showNotification('Failed to delete carousel image', 'error');
        }
    };

    const openEditModal = (image) => {
        setEditingImage(image);
        setFormData({
            title: image.title,
            description: image.description || '',
            image_url: image.image_url,
            button_text: image.button_text || '',
            button_link: image.button_link || '',
            display_order: image.display_order,
            is_active: image.is_active
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingImage(null);
        setFormData({
            title: '',
            description: '',
            image_url: '',
            button_text: '',
            button_link: '',
            display_order: 0,
            is_active: true
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
                        Homepage Carousel
                    </h2>
                    <p className="font-body-md text-on-surface-variant">
                        Manage hero carousel images on the homepage
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
                    New Image
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {images.map(image => (
                    <div key={image.id} className="bg-primary-container rounded-xl overflow-hidden border border-white/5 hover:border-secondary-container/50 transition-all">
                        <div className="aspect-video bg-surface-container-lowest relative overflow-hidden">
                            <img 
                                src={image.image_url} 
                                alt={image.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/800x450?text=Image+Not+Found';
                                }}
                            />
                            <div className="absolute top-sm right-sm">
                                <span className={`px-sm py-xs rounded-full font-caption ${image.is_active ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'}`}>
                                    {image.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div className="p-md">
                            <div className="flex items-start justify-between mb-sm">
                                <div className="flex-1">
                                    <h3 className="font-title-md text-white mb-xs">{image.title}</h3>
                                    {image.description && (
                                        <p className="font-caption text-on-surface-variant line-clamp-2">{image.description}</p>
                                    )}
                                </div>
                                <span className="ml-sm px-sm py-xs bg-surface-container rounded-full font-caption text-on-surface-variant">
                                    #{image.display_order}
                                </span>
                            </div>
                            {image.button_text && (
                                <div className="flex items-center gap-xs mb-md">
                                    <span className="material-symbols-outlined text-secondary-container text-sm">link</span>
                                    <span className="font-caption text-on-surface-variant">{image.button_text} → {image.button_link}</span>
                                </div>
                            )}
                            <div className="flex gap-sm pt-sm border-t border-white/5">
                                <button
                                    onClick={() => openEditModal(image)}
                                    className="flex-1 bg-secondary-container text-on-secondary-container px-md py-sm rounded-lg font-label-md hover:opacity-90 transition-all flex items-center justify-center gap-xs"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(image.id)}
                                    className="bg-red-500/20 text-red-400 px-md py-sm rounded-lg font-label-md hover:bg-red-500/30 transition-all flex items-center justify-center gap-xs"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {images.length === 0 && (
                <div className="text-center py-xl text-on-surface-variant">
                    No carousel images found. Create your first one.
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md overflow-y-auto">
                    <div className="bg-surface-container rounded-xl p-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-lg">
                            <h3 className="font-headline-md text-white">
                                {editingImage ? 'Edit Carousel Image' : 'New Carousel Image'}
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
                                <label className="block font-label-md text-on-surface-variant mb-xs">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="3"
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">Image URL *</label>
                                <input
                                    type="url"
                                    required
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                />
                                <p className="font-caption text-on-surface-variant mt-xs">Use Unsplash or upload to your server</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">Button Text</label>
                                    <input
                                        type="text"
                                        value={formData.button_text}
                                        onChange={(e) => setFormData({...formData, button_text: e.target.value})}
                                        placeholder="Get Started"
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">Button Link</label>
                                    <input
                                        type="text"
                                        value={formData.button_link}
                                        onChange={(e) => setFormData({...formData, button_link: e.target.value})}
                                        placeholder="/quote"
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>
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
                                    {editingImage ? 'Update Image' : 'Create Image'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CarouselManager;
