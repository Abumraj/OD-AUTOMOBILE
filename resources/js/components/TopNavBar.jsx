import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function TopNavBar() {
    const location = useLocation();
    
    const isActive = (path) => location.pathname === path;
    
    return (
        <nav className="bg-surface-container-low dark:bg-surface-container-low docked full-width top-0 border-b border-white/10 shadow-sm sticky z-50">
            <div className="flex justify-between items-center w-full px-lg py-base max-w-container-max mx-auto">
                <Link to="/" className="flex items-center gap-base">
                    <img 
                        alt="OD Automotive" 
                        className="h-10 w-auto" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB63869ZYy-o1-kIIlrJBnXNXGR2DG8GzND5S4mScSkdcOz7n2qi3mXrzIEgY-ZGubGMuBQNqKeo3tKKr4PlJivEW94_NYJjpOUwEIjedxF62tNvk3FyPWX_GCcky5NaAjc6KRTebrkdBZXqtkZ90HS4yd8P_3H-hmlMjYZ2VMVXCQpebeeUeXzzyJskmxBgRik1KfQbKODWTyaCNUG_DTB-qLzvntnduIb4bW9FuTiXznxPIBJQ3lOK02nvIHrRoaMCBvVhuzfTKRd"
                    />
                    <span className="font-headline-lg text-headline-lg font-bold text-on-surface dark:text-on-surface hidden md:block">
                        OD Automotive
                    </span>
                </Link>
                <div className="hidden md:flex items-center gap-lg">
                    <Link 
                        to="/" 
                        className={`font-title-md text-title-md transition-colors ${
                            isActive('/') 
                                ? 'text-secondary border-b-2 border-secondary pb-1' 
                                : 'text-on-surface-variant hover:text-secondary'
                        }`}
                    >
                        Home
                    </Link>
                    <Link 
                        to="/services" 
                        className={`font-title-md text-title-md transition-colors ${
                            isActive('/services') 
                                ? 'text-secondary border-b-2 border-secondary pb-1' 
                                : 'text-on-surface-variant hover:text-secondary'
                        }`}
                    >
                        Services
                    </Link>
                    <Link 
                        to="/tracking" 
                        className={`font-title-md text-title-md transition-colors ${
                            isActive('/tracking') 
                                ? 'text-secondary border-b-2 border-secondary pb-1' 
                                : 'text-on-surface-variant hover:text-secondary'
                        }`}
                    >
                        Tracking
                    </Link>
                    <Link 
                        to="/auctions" 
                        className={`font-title-md text-title-md transition-colors ${
                            isActive('/auctions') 
                                ? 'text-secondary border-b-2 border-secondary pb-1' 
                                : 'text-on-surface-variant hover:text-secondary'
                        }`}
                    >
                        Auctions
                    </Link>
                    <Link 
                        to="/contact" 
                        className={`font-title-md text-title-md transition-colors ${
                            isActive('/contact') 
                                ? 'text-secondary border-b-2 border-secondary pb-1' 
                                : 'text-on-surface-variant hover:text-secondary'
                        }`}
                    >
                        Contact
                    </Link>
                </div>
                <Link 
                    to="/quote" 
                    className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-md py-sm rounded-lg hover:opacity-80 transition-opacity active:scale-95 duration-150"
                >
                    Get a Quote
                </Link>
            </div>
        </nav>
    );
}

export default TopNavBar;
