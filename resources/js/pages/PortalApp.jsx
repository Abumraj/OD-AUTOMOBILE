import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PortalProvider, usePortal } from '../contexts/PortalContext';
import { Spinner } from '../components/portal/ui';
import { PortalForgotPage, PortalLoginPage, PortalRegisterPage, PortalResetPage } from './portal/PortalAuthPages';
import PortalDashboardPage from './portal/PortalDashboardPage';
import PortalHistoryPage from './portal/PortalHistoryPage';
import { PortalVehicleDetailPage, PortalVehiclesPage } from './portal/PortalVehiclesPage';
import PortalDocumentsPage from './portal/PortalDocumentsPage';
import PortalShipmentPage from './portal/PortalShipmentPage';
import PortalInvoicesPage from './portal/PortalInvoicesPage';
import PortalRequestsPage from './portal/PortalRequestsPage';
import { PortalTicketDetailPage, PortalTicketsPage } from './portal/PortalTicketsPage';
import PortalAnalyticsPage from './portal/PortalAnalyticsPage';
import PortalSettingsPage from './portal/PortalSettingsPage';
import PortalTeamPage from './portal/PortalTeamPage';

const NAV = [
    { to: '/portal', end: true, icon: 'dashboard', label: 'Dashboard' },
    { to: '/portal/history', icon: 'history', label: 'Service history' },
    { to: '/portal/vehicles', icon: 'directions_car', label: 'Vehicles' },
    { to: '/portal/shipment', icon: 'local_shipping', label: 'Shipment' },
    { to: '/portal/requests', icon: 'add_task', label: 'Requests & quotes' },
    { to: '/portal/invoices', icon: 'receipt_long', label: 'Invoices & payments' },
    { to: '/portal/documents', icon: 'folder_open', label: 'Documents' },
    { to: '/portal/tickets', icon: 'support_agent', label: 'Support' },
    { to: '/portal/analytics', icon: 'monitoring', label: 'Analytics' },
    { to: '/portal/team', icon: 'group', label: 'Team', ownerOnly: true },
    { to: '/portal/settings', icon: 'settings', label: 'Settings' },
];

/** Makes the portal installable: manifest + a minimal offline-tolerant service worker. */
function usePwa() {
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = '/portal-manifest.webmanifest';
        link.dataset.portal = '1';
        document.head.appendChild(link);

        const theme = document.createElement('meta');
        theme.name = 'theme-color';
        theme.content = '#0d0d6b';
        theme.dataset.portal = '1';
        document.head.appendChild(theme);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/portal-sw.js', { scope: '/portal' }).catch(() => {});
        }

        return () => document.head.querySelectorAll('[data-portal="1"]').forEach((node) => node.remove());
    }, []);
}

function PortalShell() {
    const { user, customer, logout } = usePortal();
    const [open, setOpen] = useState(false);
    const location = useLocation();

    useEffect(() => setOpen(false), [location.pathname]);

    const items = NAV.filter((item) => !item.ownerOnly || user?.role === 'owner');

    return (
        <div className="min-h-screen bg-surface text-on-surface">
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant bg-surface-container px-4 py-3 lg:hidden">
                <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-on-surface">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <span className="font-bold text-secondary">OD Business Portal</span>
                <span className="w-6" />
            </header>

            {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

            <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant bg-surface-container py-md transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="mb-md px-md">
                    <Link to="/portal" className="text-xl font-bold text-secondary">OD Logistics</Link>
                    <p className="text-xs text-on-surface-variant">Business Portal</p>
                </div>
                <nav className="flex-grow space-y-1 overflow-y-auto">
                    {items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 transition-colors ${isActive ? 'border-r-4 border-secondary bg-surface-container-highest font-bold text-secondary' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="border-t border-outline-variant px-md pt-md">
                    <div className="truncate text-sm font-semibold text-white">{customer?.company_name}</div>
                    <div className="truncate text-xs text-on-surface-variant">{user?.name} · {user?.role}</div>
                    <button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant hover:text-white">
                        <span className="material-symbols-outlined text-base">logout</span> Sign out
                    </button>
                </div>
            </aside>

            <main className="min-w-0 p-4 sm:p-md lg:ml-64 lg:p-gutter">
                <Routes>
                    <Route path="/" element={<PortalDashboardPage />} />
                    <Route path="/history" element={<PortalHistoryPage />} />
                    <Route path="/vehicles" element={<PortalVehiclesPage />} />
                    <Route path="/vehicles/:id" element={<PortalVehicleDetailPage />} />
                    <Route path="/shipment" element={<PortalShipmentPage />} />
                    <Route path="/requests" element={<PortalRequestsPage />} />
                    <Route path="/quotes" element={<Navigate to="/portal/requests" replace />} />
                    <Route path="/invoices" element={<PortalInvoicesPage />} />
                    <Route path="/documents" element={<PortalDocumentsPage />} />
                    <Route path="/tickets" element={<PortalTicketsPage />} />
                    <Route path="/tickets/:id" element={<PortalTicketDetailPage />} />
                    <Route path="/analytics" element={<PortalAnalyticsPage />} />
                    <Route path="/alerts" element={<Navigate to="/portal" replace />} />
                    <Route path="/team" element={user?.role === 'owner' ? <PortalTeamPage /> : <Navigate to="/portal" replace />} />
                    <Route path="/settings" element={<PortalSettingsPage />} />
                    <Route path="*" element={<Navigate to="/portal" replace />} />
                </Routes>
            </main>
        </div>
    );
}

function PortalRoutes() {
    const { loading, authenticated } = usePortal();
    usePwa();

    if (loading) {
        return <div className="min-h-screen bg-surface"><Spinner /></div>;
    }

    return (
        <Routes>
            <Route path="/login" element={authenticated ? <Navigate to="/portal" replace /> : <PortalLoginPage />} />
            <Route path="/register" element={authenticated ? <Navigate to="/portal" replace /> : <PortalRegisterPage />} />
            <Route path="/forgot-password" element={<PortalForgotPage />} />
            <Route path="/reset-password" element={<PortalResetPage />} />
            <Route path="/*" element={authenticated ? <PortalShell /> : <Navigate to="/portal/login" replace />} />
        </Routes>
    );
}

export default function PortalApp() {
    return (
        <PortalProvider>
            <PortalRoutes />
        </PortalProvider>
    );
}
