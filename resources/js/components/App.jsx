import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import HomePage from '../pages/HomePage';
import ServicesPage from '../pages/ServicesPage';
import TrackingPage from '../pages/TrackingPage';
import AuctionsPage from '../pages/AuctionsPage';
import ContactPage from '../pages/ContactPage';
import QuotePage from '../pages/QuotePage';
import LegalPage from '../pages/LegalPage';
import AdminDashboard from '../pages/AdminDashboard';

function App() {
    return (
        <Router>
            <div className="dark">
                <Routes>
                    <Route path="/admin/*" element={<AdminDashboard />} />
                    <Route path="*" element={
                        <div className="bg-primary-container text-on-background font-body-md overflow-x-hidden">
                            <TopNavBar />
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/services" element={<ServicesPage />} />
                                <Route path="/tracking" element={<TrackingPage />} />
                                <Route path="/auctions" element={<AuctionsPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/quote" element={<QuotePage />} />
                                <Route path="/legal/:slug" element={<LegalPage />} />
                            </Routes>
                            <Footer />
                            <WhatsAppButton />
                        </div>
                    } />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
