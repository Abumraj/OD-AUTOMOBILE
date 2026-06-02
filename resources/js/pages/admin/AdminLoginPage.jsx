import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/admin');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-container via-surface to-surface-container-low flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="bg-surface-container/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                    {/* Logo and Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary-container to-secondary rounded-2xl mb-4 shadow-lg">
                            <span className="material-symbols-outlined text-white text-4xl">admin_panel_settings</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            OD Logistics
                        </h1>
                        <p className="text-sm text-on-surface-variant">
                            Admin Panel Access
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-400 text-xl">error</span>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">mail</span>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-surface-container-lowest/50 backdrop-blur-sm border border-white/20 text-white pl-11 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all"
                                    placeholder="admin@odlogistics.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">lock</span>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full bg-surface-container-lowest/50 backdrop-blur-sm border border-white/20 text-white pl-11 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-secondary-container to-secondary text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-xl">login</span>
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-center gap-2 text-on-surface-variant text-xs">
                            <span className="material-symbols-outlined text-base">info</span>
                            <p>Default: admin@odlogistics.com / admin123</p>
                        </div>
                    </div>
                </div>

                <p className="text-center text-on-surface-variant text-xs mt-6">
                    © 2024 OD Logistics. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default AdminLoginPage;
