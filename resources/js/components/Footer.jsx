import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Footer() {
    const [legalPages, setLegalPages] = useState([]);
    const [socialLinks, setSocialLinks] = useState({});

    useEffect(() => {
        fetchLegalPages();
        fetchSocialLinks();
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

    const fetchSocialLinks = async () => {
        try {
            const response = await fetch('/api/social-media-settings');
            const data = await response.json();
            setSocialLinks(data);
        } catch (error) {
            console.error('Error fetching social links:', error);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest border-t border-white/5">
            <div className="max-w-container-max mx-auto px-4 md:px-lg py-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-lg mb-lg">
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
                            <li><Link className="hover:text-secondary transition-colors" onClick={scrollToTop} to="/auctions">Auto Auctions</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" onClick={scrollToTop} to="/services">Global Shipping</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" onClick={scrollToTop} to="/services">Container Logistics</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" onClick={scrollToTop} to="/services">Custom Clearance</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-md">
                        <h4 className="text-white font-title-md text-title-md">Support</h4>
                        <ul className="space-y-sm font-caption text-caption text-on-surface-variant">
                            <li><Link className="hover:text-secondary transition-colors" onClick={scrollToTop} to="/quote">Shipping Calculator</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" onClick={scrollToTop} to="/tracking">Track Shipment</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" onClick={scrollToTop} to="/contact">Help Center</Link></li>
                            <li><Link className="hover:text-secondary transition-colors" onClick={scrollToTop} to="/contact">Contact Us</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-md">
                        <h4 className="text-white font-title-md text-title-md">Legal</h4>
                        <ul className="space-y-sm font-caption text-caption text-on-surface-variant">
                            {legalPages.map(page => (
                                <li key={page.id}>
                                    <Link className="hover:text-secondary transition-colors" onClick={scrollToTop} to={`/legal/${page.slug}`}>
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
                        {socialLinks.facebook && (
                            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                               className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-[#1877F2] hover:bg-surface-container-highest transition-all">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
                        )}
                        {socialLinks.instagram && (
                            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                               className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-[#E4405F] hover:bg-surface-container-highest transition-all">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                            </a>
                        )}
                        {socialLinks.twitter && (
                            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                               className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-[#1DA1F2] hover:bg-surface-container-highest transition-all">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                            </a>
                        )}
                        {socialLinks.linkedin && (
                            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                               className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-[#0A66C2] hover:bg-surface-container-highest transition-all">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                            </a>
                        )}
                        {socialLinks.tiktok && (
                            <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer"
                               className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-[#000000] dark:hover:text-white hover:bg-surface-container-highest transition-all">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                            </a>
                        )}
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
