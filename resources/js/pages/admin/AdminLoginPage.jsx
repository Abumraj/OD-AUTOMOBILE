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
        <div className="min-h-screen bg-primary-container flex items-center justify-center px-lg">
            <div className="w-full max-w-md">
                <div className="bg-surface-container rounded-xl p-xl border border-white/10 shadow-2xl">
                    <div className="text-center mb-lg">
                        <h1 className="font-display-lg text-display-lg text-secondary mb-xs">
                            OD Logistics
                        </h1>
                        <p className="font-body-md text-on-surface-variant">
                            Admin Panel Login
                        </p>
                    </div>

                    {error && (
                        <div className="mb-md p-md rounded-lg bg-red-500/20 border border-red-500/50">
                            <p className="text-red-400 font-body-md">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-md">
                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                placeholder="admin@odlogistics.com"
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-on-surface-variant mb-xs">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-md py-sm rounded-lg focus:outline-none focus:border-secondary-container"
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-secondary-container text-on-secondary-container py-md rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-lg pt-lg border-t border-white/10">
                        <p className="text-on-surface-variant font-caption text-center">
                            Default credentials: admin@odlogistics.com / admin123
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminLoginPage;
