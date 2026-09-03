import React, { useState, useEffect } from 'react';
import { useConfirmation } from './ConfirmationProvider';
import api from '../../services/api';

function TestimonialsManager() {
    const { confirm } = useConfirmation();
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        quote: '',
        customer_name: '',
        location: '',
        company: '',
        social_link: '',
        rating: 5,
        is_featured: false
    });

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const data = await api.getAdminTestimonials();
            setTestimonials(data);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.updateTestimonial(editingId, formData);
                alert('Testimonial updated successfully');
            } else {
                await api.createTestimonial(formData);
                alert('Testimonial created successfully');
            }
            resetForm();
            fetchTestimonials();
        } catch (error) {
            console.error('Error saving testimonial:', error);
            alert('Failed to save testimonial');
        }
    };

    const handleEdit = (testimonial) => {
        setFormData({
            quote: testimonial.quote,
            customer_name: testimonial.customer_name,
            location: testimonial.location,
            company: testimonial.company || '',
            social_link: testimonial.social_link || '',
            rating: testimonial.rating,
            is_featured: testimonial.is_featured
        });
        setEditingId(testimonial.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!await confirm('Are you sure you want to delete this testimonial?')) {
            return;
        }
        try {
            await api.deleteTestimonial(id);
            alert('Testimonial deleted successfully');
            fetchTestimonials();
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            alert('Failed to delete testimonial');
        }
    };

    const handleToggleFeatured = async (id) => {
        try {
            await api.toggleFeaturedTestimonial(id);
            fetchTestimonials();
        } catch (error) {
            console.error('Error toggling featured status:', error);
            alert('Failed to toggle featured status');
        }
    };

    const resetForm = () => {
        setFormData({
            quote: '',
            customer_name: '',
            location: '',
            company: '',
            social_link: '',
            rating: 5,
            is_featured: false
        });
        setEditingId(null);
        setShowForm(false);
    };

    if (loading) {
        return (
            <div className="bg-surface-container p-md rounded-xl border border-outline-variant/30">
                <div className="animate-pulse space-y-md">
                    <div className="h-8 bg-surface-container-highest rounded w-1/4"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-surface-container-highest rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container p-md rounded-xl border border-outline-variant/30">
            <div className="flex justify-between items-center mb-md">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Testimonials Management</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-secondary text-on-secondary px-4 py-2 rounded font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">
                        {showForm ? 'close' : 'add'}
                    </span>
                    {showForm ? 'Cancel' : 'Add Testimonial'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-surface-container-high p-md rounded-lg mb-md space-y-sm">
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Customer Name</label>
                        <input
                            type="text"
                            value={formData.customer_name}
                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                            className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Company (Optional)</label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Social Media Link (Optional)</label>
                        <input
                            type="url"
                            value={formData.social_link}
                            onChange={(e) => setFormData({ ...formData, social_link: e.target.value })}
                            placeholder="https://instagram.com/username"
                            className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Quote</label>
                        <textarea
                            value={formData.quote}
                            onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                            className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface h-24"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-sm">
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Rating</label>
                            <select
                                value={formData.rating}
                                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface"
                            >
                                {[5, 4, 3, 2, 1].map(r => (
                                    <option key={r} value={r}>{r} Stars</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                    className="w-5 h-5 rounded border-outline-variant bg-surface-container focus:ring-secondary text-secondary"
                                />
                                <span className="text-sm text-on-surface-variant">Featured on Homepage</span>
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-secondary text-on-secondary py-2 rounded font-medium hover:opacity-90 transition-opacity"
                    >
                        {editingId ? 'Update Testimonial' : 'Create Testimonial'}
                    </button>
                </form>
            )}

            <div className="space-y-sm">
                {testimonials.length === 0 ? (
                    <div className="text-center py-8 text-on-surface-variant">
                        No testimonials yet. Add your first one!
                    </div>
                ) : (
                    testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="bg-surface-container-high p-md rounded-lg border border-outline-variant/20">
                            <div className="flex justify-between items-start mb-sm">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-on-surface">{testimonial.customer_name}</h3>
                                        {testimonial.is_featured && (
                                            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-medium border border-yellow-500/30">
                                                FEATURED
                                            </span>
                                        )}
                                        {testimonial.is_approved && (
                                            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium border border-green-500/30">
                                                APPROVED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-on-surface-variant">
                                        {testimonial.location}
                                        {testimonial.company && ` • ${testimonial.company}`}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <span
                                                key={i}
                                                className={`material-symbols-outlined text-sm ${
                                                    i < testimonial.rating ? 'text-yellow-400' : 'text-on-surface-variant/30'
                                                }`}
                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                            >
                                                star
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleFeatured(testimonial.id)}
                                        className={`p-2 rounded transition-colors ${
                                            testimonial.is_featured
                                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                                        }`}
                                        title={testimonial.is_featured ? 'Unfeature' : 'Feature'}
                                    >
                                        <span className="material-symbols-outlined text-sm">star</span>
                                    </button>
                                    <button
                                        onClick={() => handleEdit(testimonial)}
                                        className="p-2 rounded bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                                        title="Edit"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(testimonial.id)}
                                        className="p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                        title="Delete"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                            <p className="text-on-surface-variant italic">"{testimonial.quote}"</p>
                            <p className="text-xs text-on-surface-variant/60 mt-2">
                                Added {new Date(testimonial.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TestimonialsManager;
