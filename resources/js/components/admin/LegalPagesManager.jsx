import React, { useState, useEffect } from 'react';
import { useConfirmation } from './ConfirmationProvider';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function LegalPagesManager() {
    const { confirm } = useConfirmation();
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        slug: '',
        title: '',
        content: '',
        meta_description: '',
        is_published: true,
        display_order: 0
    });

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const response = await fetch('/api/admin/legal-pages');
            const data = await response.json();
            setPages(data);
        } catch (error) {
            console.error('Error fetching pages:', error);
            showNotification('Failed to load pages', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingPage 
                ? `/api/admin/legal-pages/${editingPage.id}`
                : '/api/admin/legal-pages';
            
            const method = editingPage ? 'PUT' : 'POST';

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
                    editingPage ? 'Page updated successfully' : 'Page created successfully',
                    'success'
                );
                setShowModal(false);
                resetForm();
                fetchPages();
            } else {
                showNotification(data.message || 'Failed to save page', 'error');
            }
        } catch (error) {
            console.error('Error saving page:', error);
            showNotification('Failed to save page', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!await confirm('Are you sure you want to delete this page?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/legal-pages/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Page deleted successfully', 'success');
                fetchPages();
            } else {
                showNotification('Failed to delete page', 'error');
            }
        } catch (error) {
            console.error('Error deleting page:', error);
            showNotification('Failed to delete page', 'error');
        }
    };

    const openEditModal = (page) => {
        setEditingPage(page);
        setFormData({
            slug: page.slug,
            title: page.title,
            content: page.content,
            meta_description: page.meta_description || '',
            is_published: page.is_published,
            display_order: page.display_order
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingPage(null);
        setFormData({
            slug: '',
            title: '',
            content: '',
            meta_description: '',
            is_published: true,
            display_order: 0
        });
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link'],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'indent',
        'link',
        'align',
        'color', 'background'
    ];

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
                        Legal Pages Management
                    </h2>
                    <p className="font-body-md text-on-surface-variant">
                        Manage privacy policy, terms of service, and other legal pages
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
                    New Page
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Order</th>
                            <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Title</th>
                            <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Slug</th>
                            <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Status</th>
                            <th className="text-left py-sm px-md font-label-md text-on-surface-variant">Last Updated</th>
                            <th className="text-right py-sm px-md font-label-md text-on-surface-variant">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.map(page => (
                            <tr key={page.id} className="border-b border-white/5 hover:bg-primary-container/50 transition-colors">
                                <td className="py-md px-md font-label-md text-white">{page.display_order}</td>
                                <td className="py-md px-md font-body-md text-white">{page.title}</td>
                                <td className="py-md px-md font-caption text-on-surface-variant">/{page.slug}</td>
                                <td className="py-md px-md">
                                    <span className={`px-sm py-xs rounded-full font-caption ${page.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {page.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td className="py-md px-md font-caption text-on-surface-variant">
                                    {new Date(page.updated_at).toLocaleDateString()}
                                </td>
                                <td className="py-md px-md text-right">
                                    <button
                                        onClick={() => openEditModal(page)}
                                        className="text-secondary-container hover:text-white transition-colors p-xs"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(page.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors p-xs ml-sm"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pages.length === 0 && (
                    <div className="text-center py-xl text-on-surface-variant">
                        No pages found. Create your first legal page.
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md overflow-y-auto">
                    <div className="bg-surface-container rounded-xl p-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-lg">
                            <h3 className="font-headline-md text-white">
                                {editingPage ? 'Edit Page' : 'New Page'}
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
                                        onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                                        placeholder="privacy-policy"
                                        className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">Meta Description</label>
                                <input
                                    type="text"
                                    value={formData.meta_description}
                                    onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">Content *</label>
                                <div className="bg-white rounded-lg">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.content}
                                        onChange={(content) => setFormData({...formData, content})}
                                        modules={modules}
                                        formats={formats}
                                        className="h-64"
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
                                            checked={formData.is_published}
                                            onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                                            className="w-5 h-5"
                                        />
                                        <span className="font-label-md text-white">Published</span>
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
                                    {editingPage ? 'Update Page' : 'Create Page'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LegalPagesManager;
