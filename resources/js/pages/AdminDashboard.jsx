import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopBar from '../components/admin/AdminTopBar';
import AdminOverview from './admin/AdminOverview';
import AdminAnalyticsPage from './admin/AdminAnalyticsPage';
import AdminShipmentsPage from './admin/AdminShipmentsPage';
import AdminQuotesPage from './admin/AdminQuotesPage';
import AdminTestimonialsPage from './admin/AdminTestimonialsPage';
import AdminSettingsPage from './admin/AdminSettingsPage';
import GeneralSettingsPage from './admin/settings/GeneralSettingsPage';
import EmailTemplatesPage from './admin/settings/EmailTemplatesPage';
import SMSSettingsPage from './admin/settings/SMSSettingsPage';
import HomepageSettingsPage from './admin/settings/HomepageSettingsPage';
import ContactSettingsPage from './admin/settings/ContactSettingsPage';
import SocialMediaSettingsPage from './admin/settings/SocialMediaSettingsPage';
import PerformanceSettingsPage from './admin/settings/PerformanceSettingsPage';
import TrackingSettingsPage from './admin/settings/TrackingSettingsPage';
import ShippingConfigPage from './admin/settings/ShippingConfigPage';
import AdminMessagesPage from './admin/AdminMessagesPage';
import AdminAuctionsPage from './admin/AdminAuctionsPage';
import AdminLegalPagesPage from './admin/AdminLegalPagesPage';
import AdminAboutUsPage from './admin/content/AboutUsPage';
import AdminCarouselPage from './admin/AdminCarouselPage';
import AdminServicesPage from './admin/AdminServicesPage';
import AdminLoginPage from './admin/AdminLoginPage';
import AdminUsersPage from './admin/AdminUsersPage';

function AdminDashboard() {
    const [authenticated, setAuthenticated] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/admin/check-auth');
            const data = await response.json();
            
            if (data.authenticated) {
                setAuthenticated(true);
                setAdmin(data.admin);
            } else {
                setAuthenticated(false);
                navigate('/admin/login');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setAuthenticated(false);
            navigate('/admin/login');
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            setAuthenticated(false);
            setAdmin(null);
            navigate('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (authenticated === null) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="animate-pulse text-on-surface-variant">Loading...</div>
            </div>
        );
    }

    if (!authenticated) {
        return <AdminLoginPage />;
    }

    return (
        <div className="overflow-hidden bg-surface min-h-screen">
            <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} admin={admin} />

            <main className="lg:ml-64 flex flex-col min-h-screen bg-surface">
                <AdminTopBar admin={admin} onLogout={handleLogout} onMenuToggle={() => setSidebarOpen(true)} />

                <div className="flex-grow overflow-y-auto p-4 lg:p-gutter">
                    <Routes>
                        <Route path="/" element={<AdminOverview />} />
                        <Route path="/analytics" element={<AdminAnalyticsPage />} />
                        <Route path="/shipments" element={<AdminShipmentsPage />} />
                        <Route path="/quotes" element={<AdminQuotesPage />} />
                        <Route path="/auctions" element={<AdminAuctionsPage />} />
                        <Route path="/testimonials" element={<AdminTestimonialsPage />} />
                        <Route path="/messages" element={<AdminMessagesPage />} />
                        <Route path="/services" element={<AdminServicesPage />} />
                        <Route path="/carousel" element={<AdminCarouselPage />} />
                        <Route path="/legal-pages" element={<AdminLegalPagesPage />} />
                        <Route path="/about-us" element={<AdminAboutUsPage />} />
                        <Route path="/settings" element={<AdminSettingsPage />} />
                        <Route path="/settings/general" element={<GeneralSettingsPage />} />
                        <Route path="/settings/email-templates" element={<EmailTemplatesPage />} />
                        <Route path="/settings/sms" element={<SMSSettingsPage />} />
                        <Route path="/settings/homepage" element={<HomepageSettingsPage />} />
                        <Route path="/settings/contact" element={<ContactSettingsPage />} />
                        <Route path="/settings/social-media" element={<SocialMediaSettingsPage />} />
                        <Route path="/settings/performance" element={<PerformanceSettingsPage />} />
                        <Route path="/settings/tracking" element={<TrackingSettingsPage />} />
                        <Route path="/settings/shipping" element={<ShippingConfigPage />} />
                        <Route path="/admin-users" element={<AdminUsersPage />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;
