import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        is_active: true
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/admin-users');
            if (response.status === 403) {
                setError('Unauthorized. Superadmin access required.');
                setLoading(false);
                return;
            }
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching admin users:', error);
            setError('Failed to load admin users');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
                is_active: user.is_active
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'admin',
                is_active: true
            });
        }
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'admin',
            is_active: true
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const url = editingUser 
                ? `/api/admin/admin-users/${editingUser.id}`
                : '/api/admin/admin-users';
            
            const method = editingUser ? 'PUT' : 'POST';
            
            const submitData = editingUser && !formData.password
                ? { ...formData, password: undefined }
                : formData;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to save user');
            }

            setSuccess(data.message);
            handleCloseModal();
            fetchUsers();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDelete = async (userId, userName) => {
        if (!confirm(`Are you sure you want to delete ${userName}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/admin-users/${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user');
            }

            setSuccess(data.message);
            fetchUsers();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleToggleActive = async (user) => {
        try {
            const response = await fetch(`/api/admin/admin-users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_active: !user.is_active
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update user');
            }

            fetchUsers();
        } catch (error) {
            setError(error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-secondary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-gutter">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-display-lg text-display-lg text-on-surface mb-1">Admin Users</h1>
                    <p className="text-on-surface-variant">Manage administrator accounts and permissions</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-secondary text-on-secondary px-6 py-3 rounded-lg font-label-lg flex items-center space-x-2 hover:opacity-90 transition-opacity"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    <span>Add Admin User</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center space-x-2">
                    <span className="material-symbols-outlined">error</span>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center space-x-2">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{success}</span>
                </div>
            )}

            <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
                <table className="w-full">
                    <thead className="bg-surface-container-high border-b border-outline-variant">
                        <tr>
                            <th className="text-left px-6 py-4 font-label-lg text-on-surface">Name</th>
                            <th className="text-left px-6 py-4 font-label-lg text-on-surface">Email</th>
                            <th className="text-left px-6 py-4 font-label-lg text-on-surface">Role</th>
                            <th className="text-left px-6 py-4 font-label-lg text-on-surface">Status</th>
                            <th className="text-left px-6 py-4 font-label-lg text-on-surface">Last Login</th>
                            <th className="text-right px-6 py-4 font-label-lg text-on-surface">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-outline-variant hover:bg-surface-container-highest transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-secondary">person</span>
                                        </div>
                                        <span className="font-label-lg text-on-surface">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-on-surface-variant">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'superadmin' 
                                            ? 'bg-purple-500/20 text-purple-400' 
                                            : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {user.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleToggleActive(user)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            user.is_active 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : 'bg-red-500/20 text-red-400'
                                        }`}
                                    >
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-on-surface-variant">
                                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => handleOpenModal(user)}
                                            className="p-2 text-on-surface-variant hover:text-secondary hover:bg-surface-container-low rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id, user.name)}
                                            className="p-2 text-on-surface-variant hover:text-red-400 hover:bg-surface-container-low rounded-lg transition-all"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface-container rounded-xl max-w-md w-full p-6 border border-outline-variant">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-display-md text-display-md text-on-surface">
                                {editingUser ? 'Edit Admin User' : 'Add Admin User'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-label-md text-on-surface mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:ring-2 focus:ring-secondary focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:ring-2 focus:ring-secondary focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface mb-2">
                                    Password {editingUser && '(leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:ring-2 focus:ring-secondary focus:outline-none"
                                    required={!editingUser}
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface mb-2">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:ring-2 focus:ring-secondary focus:outline-none"
                                    required
                                >
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Superadmin</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-secondary bg-surface-container-low border-outline-variant rounded focus:ring-2 focus:ring-secondary"
                                />
                                <label htmlFor="is_active" className="font-label-md text-on-surface">Active</label>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-label-lg hover:bg-surface-container-highest transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-lg hover:opacity-90 transition-opacity"
                                >
                                    {editingUser ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsersPage;
