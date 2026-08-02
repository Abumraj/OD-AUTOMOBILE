import React, { useState, useEffect } from 'react';

function AboutUsPage() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSection, setEditingSection] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        section_key: '',
        title: '',
        subtitle: '',
        content: '',
        image_url: '',
        is_published: true,
        display_order: 0
    });

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const response = await fetch('/api/admin/about-us');
            const data = await response.json();
            setSections(data);
        } catch (error) {
            console.error('Error fetching sections:', error);
            showNotification('Failed to load sections', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (section) => {
        setEditingSection(section);
        setIsCreating(false);
        setFormData({
            section_key: section.section_key || '',
            title: section.title || '',
            subtitle: section.subtitle || '',
            content: section.content || '',
            image_url: section.image_url || '',
            is_published: section.is_published,
            display_order: section.display_order || 0
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingSection(null);
        setIsCreating(true);
        const nextLeaderNumber = sections.filter(s => s.section_key.startsWith('leader_')).length + 1;
        setFormData({
            section_key: `leader_${nextLeaderNumber}`,
            title: '',
            subtitle: '',
            content: '',
            image_url: '',
            is_published: true,
            display_order: sections.length + 1
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const url = isCreating ? '/api/admin/about-us' : `/api/admin/about-us/${editingSection.id}`;
            const method = isCreating ? 'POST' : 'PUT';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (response.ok) {
                showNotification(isCreating ? 'Section created successfully' : 'Section updated successfully', 'success');
                fetchSections();
                setShowModal(false);
                resetForm();
            } else {
                showNotification(result.message || `Failed to ${isCreating ? 'create' : 'update'} section`, 'error');
            }
        } catch (error) {
            console.error(`Error ${isCreating ? 'creating' : 'updating'} section:`, error);
            showNotification(`Failed to ${isCreating ? 'create' : 'update'} section`, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this section?')) return;
        
        try {
            const response = await fetch(`/api/admin/about-us/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (response.ok) {
                showNotification('Section deleted successfully', 'success');
                fetchSections();
            } else {
                showNotification(result.message || 'Failed to delete section', 'error');
            }
        } catch (error) {
            console.error('Error deleting section:', error);
            showNotification('Failed to delete section', 'error');
        }
    };

    const resetForm = () => {
        setEditingSection(null);
        setIsCreating(false);
        setFormData({
            section_key: '',
            title: '',
            subtitle: '',
            content: '',
            image_url: '',
            is_published: true,
            display_order: 0
        });
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const getSectionTypeLabel = (sectionKey) => {
        if (sectionKey === 'hero') return 'Hero Section';
        if (sectionKey === 'mission') return 'Mission';
        if (sectionKey === 'vision') return 'Vision';
        if (sectionKey.startsWith('leader_')) return 'Leadership';
        if (sectionKey.startsWith('timeline_')) return 'Timeline';
        return 'Content Section';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-on-surface-variant">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-lg">
            {notification && (
                <div className={`fixed top-4 right-4 px-md py-sm rounded-lg shadow-lg z-50 ${
                    notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white`}>
                    {notification.message}
                </div>
            )}

            <div className="mb-lg flex items-start justify-between">
                <div>
                    <h1 className="font-headline-lg text-headline-lg text-white mb-xs">About Us Content</h1>
                    <p className="text-on-surface-variant">Manage the content displayed on your About Us page</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-md py-sm bg-secondary-container text-on-secondary-container rounded-lg hover:opacity-90 transition-opacity flex items-center gap-xs"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add New Section
                </button>
            </div>

            <div className="grid grid-cols-1 gap-md">
                {sections.map((section) => (
                    <div key={section.id} className="bg-surface-container-high rounded-xl p-md border border-white/5">
                        <div className="flex items-start justify-between mb-sm">
                            <div className="flex-1">
                                <div className="flex items-center gap-sm mb-xs">
                                    <span className="px-sm py-xs bg-secondary-container/20 text-secondary rounded text-xs font-medium">
                                        {getSectionTypeLabel(section.section_key)}
                                    </span>
                                    <span className={`px-sm py-xs rounded text-xs ${
                                        section.is_published 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                        {section.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <h3 className="font-title-md text-white">{section.title}</h3>
                                {section.subtitle && (
                                    <p className="text-sm text-secondary mt-xs">{section.subtitle}</p>
                                )}
                                <p className="text-on-surface-variant mt-sm line-clamp-2">{section.content}</p>
                                {section.image_url && (
                                    <div className="mt-sm">
                                        <img 
                                            src={section.image_url} 
                                            alt={section.title}
                                            className="w-32 h-32 object-cover rounded border border-white/10"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="ml-md flex gap-sm">
                                <button
                                    onClick={() => openEditModal(section)}
                                    className="px-md py-sm bg-secondary-container text-on-secondary-container rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Edit
                                </button>
                                {section.section_key.startsWith('leader_') && (
                                    <button
                                        onClick={() => handleDelete(section.id)}
                                        className="px-md py-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface-container-low rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-surface-container-low border-b border-white/10 p-lg">
                            <h2 className="font-headline-lg text-white">{isCreating ? 'Add New Section' : 'Edit Section'}</h2>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-lg space-y-md">
                            {isCreating && (
                                <div>
                                    <label className="block font-label-md text-on-surface-variant mb-xs">Section Key *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.section_key}
                                        onChange={(e) => setFormData({...formData, section_key: e.target.value})}
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                        placeholder="e.g., leader_3"
                                    />
                                    <p className="text-xs text-on-surface-variant mt-xs">Unique identifier for this section (e.g., leader_3, leader_4)</p>
                                </div>
                            )}
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
                                <label className="block font-label-md text-on-surface-variant mb-xs">Subtitle</label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    placeholder="Optional subtitle or label"
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">Content *</label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                                    rows="6"
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs flex items-center gap-xs">
                                    <span className="material-symbols-outlined text-sm">image</span>
                                    Staff Image
                                </label>
                                <div className="space-y-sm">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            const formDataUpload = new FormData();
                                            formDataUpload.append('image', file);

                                            try {
                                                const response = await fetch('/api/admin/upload/vehicle-image', {
                                                    method: 'POST',
                                                    body: formDataUpload
                                                });

                                                const result = await response.json();
                                                
                                                if (result.success) {
                                                    setFormData({...formData, image_url: result.data.url});
                                                    showNotification('Image uploaded successfully', 'success');
                                                } else {
                                                    showNotification('Failed to upload image', 'error');
                                                }
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                showNotification('Failed to upload image', 'error');
                                            }
                                        }}
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-secondary-container file:text-on-secondary-container hover:file:opacity-90"
                                    />
                                    <p className="text-xs text-on-surface-variant">
                                        📸 Upload staff image (JPG, PNG, GIF, WebP - Max 5MB)
                                    </p>
                                    {formData.image_url && (
                                        <div className="mt-sm p-sm bg-surface-container rounded-lg">
                                            <div className="flex items-start justify-between mb-xs">
                                                <p className="text-xs text-on-surface-variant">Preview:</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({...formData, image_url: ''})}
                                                    className="text-xs text-red-400 hover:text-red-300"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <img 
                                                src={formData.image_url} 
                                                alt="Staff preview" 
                                                className="w-full max-w-xs h-auto object-cover rounded border border-white/10"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextElementSibling.style.display = 'block';
                                                }}
                                            />
                                            <div style={{display: 'none'}} className="text-xs text-red-400 p-sm">
                                                ⚠️ Image failed to load
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-sm">
                                <input
                                    type="checkbox"
                                    id="is_published"
                                    checked={formData.is_published}
                                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                                    className="rounded border-white/20 bg-surface-container-lowest text-secondary-container focus:ring-secondary-container"
                                />
                                <label htmlFor="is_published" className="font-label-md text-on-surface-variant">
                                    Published (visible on website)
                                </label>
                            </div>

                            <div className="flex justify-end gap-md pt-md border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-lg py-sm border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-lg py-sm bg-secondary-container text-on-secondary-container rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AboutUsPage;
