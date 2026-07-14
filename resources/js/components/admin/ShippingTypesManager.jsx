import React, { useState, useEffect } from 'react';

function ShippingTypesManager() {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', is_active: true });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const response = await fetch('/api/admin/shipping-types');
            const data = await response.json();
            setTypes(data);
        } catch (error) {
            console.error('Error fetching shipping types:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId 
                ? `/api/admin/shipping-types/${editingId}`
                : '/api/admin/shipping-types';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchTypes();
                setFormData({ name: '', is_active: true });
                setEditingId(null);
                setShowForm(false);
            }
        } catch (error) {
            console.error('Error saving shipping type:', error);
        }
    };

    const handleEdit = (type) => {
        setFormData({ name: type.name, is_active: type.is_active });
        setEditingId(type.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this shipping type?')) return;

        try {
            await fetch(`/api/admin/shipping-types/${id}`, { method: 'DELETE' });
            fetchTypes();
        } catch (error) {
            console.error('Error deleting shipping type:', error);
        }
    };

    const handleCancel = () => {
        setFormData({ name: '', is_active: true });
        setEditingId(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="text-on-surface-variant">Loading...</div>;
    }

    return (
        <div className="bg-surface-container rounded-xl p-lg border border-white/10">
            <div className="flex items-center justify-between mb-md">
                <div>
                    <h2 className="font-title-lg text-white mb-xs">Shipping Types</h2>
                    <p className="font-body-sm text-on-surface-variant">
                        Manage available shipping types (Container, RoRo, etc.)
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-secondary text-on-secondary px-md py-sm rounded-lg hover:opacity-90 transition-opacity font-label-md flex items-center space-x-xs"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Add Type</span>
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-surface rounded-lg p-md mb-md border border-outline-variant">
                    <div className="space-y-md">
                        <div>
                            <label className="block font-label-md text-on-surface mb-xs">Type Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-surface-container-highest text-on-surface border border-outline rounded-lg px-md py-sm focus:border-secondary focus:outline-none"
                                placeholder="e.g., Container, RoRo"
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-xs">
                            <input
                                type="checkbox"
                                id="type-active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded border-outline"
                            />
                            <label htmlFor="type-active" className="font-label-md text-on-surface">Active</label>
                        </div>
                        <div className="flex space-x-sm">
                            <button
                                type="submit"
                                className="bg-secondary text-on-secondary px-md py-sm rounded-lg hover:opacity-90 transition-opacity font-label-md"
                            >
                                {editingId ? 'Update' : 'Create'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-surface-container text-on-surface px-md py-sm rounded-lg hover:bg-surface-container-highest transition-colors font-label-md"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="space-y-sm">
                {types.map((type) => (
                    <div
                        key={type.id}
                        className="flex items-center justify-between bg-surface rounded-lg p-md border border-outline-variant"
                    >
                        <div className="flex items-center space-x-md">
                            <span className="material-symbols-outlined text-secondary">local_shipping</span>
                            <div>
                                <div className="font-label-lg text-white">{type.name}</div>
                                <div className="font-body-sm text-on-surface-variant">Code: {type.code}</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-sm">
                            <span className={`px-sm py-xs rounded-full text-xs font-medium ${
                                type.is_active 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                            }`}>
                                {type.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                                onClick={() => handleEdit(type)}
                                className="p-sm text-on-surface-variant hover:text-secondary transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                                onClick={() => handleDelete(type.id)}
                                className="p-sm text-on-surface-variant hover:text-error transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ShippingTypesManager;
