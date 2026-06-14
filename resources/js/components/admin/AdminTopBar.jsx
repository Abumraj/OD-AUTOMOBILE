import React from 'react';

function AdminTopBar({ admin, onLogout, onMenuToggle }) {
    return (
        <header className="h-16 flex justify-between items-center px-4 lg:px-gutter border-b border-outline-variant bg-surface sticky top-0 z-40">
            <div className="flex items-center flex-1 gap-3">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all"
                    aria-label="Open menu"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="relative w-full max-w-md group hidden sm:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                    <input
                        className="w-full bg-surface-container-low border-outline-variant border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-secondary focus:outline-none text-on-surface transition-all"
                        placeholder="Search tracking ID, vehicle, or customer..."
                        type="text"
                    />
                </div>
            </div>
            <div className="flex items-center space-x-md">
                <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
                    <span className="material-symbols-outlined">notifications</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
                    <span className="material-symbols-outlined">history</span>
                </button>
                <div className="flex items-center space-x-3 ml-2 border-l border-outline-variant pl-md">
                    <div className="text-right">
                        <p className="font-label-md text-on-surface">Admin Center</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Superuser</p>
                    </div>
                    <img
                        alt="Administrator Avatar"
                        className="w-10 h-10 rounded-full object-cover border border-secondary"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg9bNWZDTd41vYv8gvgcJluAYNz2ul_PIA-H6Ot68anUiMlj_k8UHXfnACGxuq0Nu8BbkWRgQTIGlsqYmqw-MQoDWX5q9zab2R9MKdbXR-p3YLLcR0EaVB6yaw0kN-OCDY8NBgbE1RUbkLuUSGm3yZuUQ_jCiEnly_PBd9-3v3n-xQeGvt9Ar2WOhBHE3ICy30fnuqCTMymvfFX_7h2h-v9TZ7zxwiUjERZt6doCVmgZZkBf44Vq-wjPeskKWRjE9xFEIvTNhF9rKd"
                    />
                </div>
            </div>
        </header>
    );
}

export default AdminTopBar;
