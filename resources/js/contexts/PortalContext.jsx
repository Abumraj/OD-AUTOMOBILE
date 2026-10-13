import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import portalApi from '../services/portalApi';

const PortalContext = createContext(null);

export function PortalProvider({ children }) {
    const [state, setState] = useState({ loading: true, authenticated: false, user: null, customer: null, config: null, paymentMethods: [] });

    const refresh = useCallback(async () => {
        try {
            const data = await portalApi.get('/check-auth');
            setState({
                loading: false,
                authenticated: Boolean(data.authenticated),
                user: data.user || null,
                customer: data.customer || null,
                config: data.config || null,
                paymentMethods: data.payment_methods || [],
            });
        } catch (error) {
            setState((current) => ({ ...current, loading: false, authenticated: false }));
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const logout = useCallback(async () => {
        try {
            await portalApi.post('/logout');
        } finally {
            await refresh();
        }
    }, [refresh]);

    const can = useCallback((ability) => {
        const abilities = state.user?.abilities || [];
        return abilities.includes('*') || abilities.includes(ability);
    }, [state.user]);

    return (
        <PortalContext.Provider value={{ ...state, refresh, logout, can }}>
            {children}
        </PortalContext.Provider>
    );
}

export function usePortal() {
    const context = useContext(PortalContext);
    if (!context) throw new Error('usePortal must be used inside PortalProvider');
    return context;
}
