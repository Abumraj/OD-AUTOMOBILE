import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Footer() {
    const [legalPages, setLegalPages] = useState([]);

    useEffect(() => {
        fetchLegalPages();
    }, []);

    const fetchLegalPages = async () => {
        try {
            const response = await fetch('/api/legal-pages/published');
            const data = await response.json();
            setLegalPages(data);
        } catch (error) {
            console.error('Error fetching legal pages:', error);
        }
    };

    return (
        <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest border-t border-white/5">
            <div className="max-w-container-max mx-auto px-lg py-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-lg">
                    <div className="col-span-1 md:col-span-1 space-y-md">
                        <div className="flex items-center gap-base">
                            <img 
                                alt="OD Automotive" 
                                className="h-8 w-auto" 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB63869ZYy-o1-kIIlrJBnXNXGR2DG8GzND5S4mScSkdcOz7n2qi3mXrzIEgY-ZGubGMuBQNqKeo3tKKr4PlJivEW94_NYJjpOUwEIjedxF62tNvk3FyPWX_GCcky5NaAjc6KRTebrkdBZXqtkZ90HS4yd8P_3H-hmlMjYZ2VMVXCQpebeeUeXzzyJskmxBgRik1KfQbKODWTyaCNUG_DTB-qLzvntnduIb4bW9FuTiXznxPIBJQ3lOK02nvIHrRoaMCBvVhuzfTKRd"
                            />
                            <span className="font-title-md text-title-md font-bold text-on-surface">
                                OD Automotive
                            </span>
                        </div>
                        <p className="font-caption text-caption text-on-surface-variant max-w-xs">
                            Authoritative automotive transport and logistics solutions designed for high-stakes precision and unwavering reliability.
                        </p>
                    </div>
                    <div className="space-y-md">
                        <h4 className="text-white font-title-md text-title-md">Services</h4>
                        <ul className="space-y-sm font-caption text-caption text-on-surface-variant">
                            <li><Link className="hover:text-secondary transition-colors" to="/auctions">Auto Auctions</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" to="/services">Global Shipping</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" to="/services">Container Logistics</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" to="/services">Custom Clearance</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-md">
                        <h4 className="text-white font-title-md text-title-md">Support</h4>
                        <ul className="space-y-sm font-caption text-caption text-on-surface-variant">
                            <li><Link className="hover:text-secondary transition-colors" to="/quote">Shipping Calculator</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" to="/tracking">Track Shipment</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" to="/contact">Help Center</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" to="/contact">Contact Us</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-md">
                        <h4 className="text-white font-title-md text-title-md">Legal</h4>
                        <ul className="space-y-sm font-caption text-caption text-on-surface-variant">
                            {legalPages.map(page => (
                                <li key={page.id}>
                                    <Link className="hover:text-secondary transition-colors" to={`/legal/${page.slug}`}>
                                        {page.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="pt-lg border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-md">
                    <span className="font-caption text-caption text-on-surface-variant">
                        © 2024 OD Automotive &amp; Logistics. Reliable industrial transport solutions.
                    </span>
                    <div className="flex items-center gap-md">
                        <div className="px-md py-xs border border-white/20 rounded-full flex items-center gap-xs">
                            <span className="text-xs font-mono text-on-surface-variant">
                                @odautomotiveandlogistics
                            </span>
                            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                verified
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
