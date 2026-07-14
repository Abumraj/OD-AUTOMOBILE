import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function AdminAboutUsPage() {
    const [sections, setSections] = useState([]);
    const [editingSection, setEditingSection] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        is_published: true,
        display_order: 0
    });
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const response = await fetch('/api/admin/about-us', {
                credentials: 'include'
            });
            const data = await response.json();
            setSections(data);
        } catch (error) {
            console.error('Error fetching About Us sections:', error);
        }
    };

    const openEditModal = async (section) => {
        setEditingSection(section);
        setFormData({
            title: section.title,
            content: section.content,
            is_published: section.is_published,
            display_order: section.display_order
        });
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingSection(null);
        setFormData({
            title: '',
            content: '',
            is_published: true,
            display_order: 0
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`/api/admin/about-us/${editingSection.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Section updated successfully!');
                fetchSections();
                closeEditModal();
            } else {
                alert('Failed to update section');
            }
        } catch (error) {
            console.error('Error updating section:', error);
            alert('Failed to update section');
        }
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

    return (
        <div className="space-y-gutter">
            <div>
                <h2 className="font-display-sm text-display-sm text-on-surface mb-xs">About Us Page Management</h2>
                <p className="font-body-md text-on-surface-variant">Manage the content sections of your About Us page</p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-surface-container-low border-b border-outline-variant/10">
                            <tr>
                                <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface">Section</th>
                                <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface">Title</th>
                                <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface">Order</th>
                                <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface">Status</th>
                                <th className="px-lg py-md text-left font-label-md text-label-md text-on-surface">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sections.map((section) => (
                                <tr key={section.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                                    <td className="px-lg py-md font-body-md text-on-surface">{section.section_key}</td>
                                    <td className="px-lg py-md font-body-md text-on-surface">{section.title}</td>
                                    <td className="px-lg py-md font-body-md text-on-surface">{section.display_order}</td>
                                    <td className="px-lg py-md">
                                        <span className={`px-sm py-xs rounded-full font-label-sm text-label-sm ${
                                            section.is_published 
                                                ? 'bg-secondary-container/20 text-secondary-container' 
                                                : 'bg-surface-container text-on-surface-variant'
                                        }`}>
                                            {section.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-lg py-md">
                                        <button
                                            onClick={() => openEditModal(section)}
                                            className="text-secondary-container hover:text-secondary-container/80 font-label-md text-label-md"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface-container-lowest rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/10 px-lg py-md flex items-center justify-between">
                            <h3 className="font-title-lg text-title-lg text-on-surface">Edit Section: {editingSection?.section_key}</h3>
                            <button
                                onClick={closeEditModal}
                                className="text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-lg space-y-md">
                            <div>
                                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                                    Section Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full bg-surface-container border border-outline-variant/30 text-on-surface px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-label-md text-on-surface mb-xs">
                                    Content
                                </label>
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

                            <div className="grid grid-cols-2 gap-md pt-12">
                                <div>
                                    <label className="block font-label-md text-label-md text-on-surface mb-xs">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                                        className="w-full bg-surface-container border border-outline-variant/30 text-on-surface px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    />
                                </div>

                                <div>
                                    <label className="block font-label-md text-label-md text-on-surface mb-xs">
                                        Status
                                    </label>
                                    <select
                                        value={formData.is_published ? 'published' : 'draft'}
                                        onChange={(e) => setFormData({...formData, is_published: e.target.value === 'published'})}
                                        className="w-full bg-surface-container border border-outline-variant/30 text-on-surface px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-md pt-md border-t border-outline-variant/10">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="flex-1 bg-surface-container text-on-surface px-lg py-md rounded-lg hover:bg-surface-container-high transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-secondary-container text-on-secondary px-lg py-md rounded-lg hover:opacity-90 transition-opacity"
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

export default AdminAboutUsPage;
