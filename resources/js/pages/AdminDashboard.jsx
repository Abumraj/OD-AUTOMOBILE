import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopBar from '../components/admin/AdminTopBar';
import AdminOverview from './admin/AdminOverview';
import AdminShipmentsPage from './admin/AdminShipmentsPage';
import AdminQuotesPage from './admin/AdminQuotesPage';
import AdminTestimonialsPage from './admin/AdminTestimonialsPage';
import AdminSettingsPage from './admin/AdminSettingsPage';
import AdminMessagesPage from './admin/AdminMessagesPage';
import AdminAuctionsPage from './admin/AdminAuctionsPage';
import AdminLegalPagesPage from './admin/AdminLegalPagesPage';
import AdminCarouselPage from './admin/AdminCarouselPage';
import AdminServicesPage from './admin/AdminServicesPage';

function AdminDashboard() {
    return (
        <div className="overflow-hidden bg-surface min-h-screen">
            <AdminSidebar />
            
            <main className="ml-64 flex flex-col h-screen bg-surface">
                <AdminTopBar />
                
                <div className="flex-grow overflow-y-auto p-gutter">
                    <Routes>
                        <Route path="/" element={<AdminOverview />} />
                        <Route path="/shipments" element={<AdminShipmentsPage />} />
                        <Route path="/quotes" element={<AdminQuotesPage />} />
                        <Route path="/auctions" element={<AdminAuctionsPage />} />
                        <Route path="/testimonials" element={<AdminTestimonialsPage />} />
                        <Route path="/messages" element={<AdminMessagesPage />} />
                        <Route path="/services" element={<AdminServicesPage />} />
                        <Route path="/carousel" element={<AdminCarouselPage />} />
                        <Route path="/legal-pages" element={<AdminLegalPagesPage />} />
                        <Route path="/settings" element={<AdminSettingsPage />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;
