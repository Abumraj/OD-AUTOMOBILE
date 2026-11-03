import React, { createContext, useContext, useMemo } from 'react';

const AdminContext = createContext({ admin: null, isSuperAdmin: false, canManageSignature: false });

/**
 * Who is signed in to the admin dashboard. Hiding things here is only a convenience:
 * the API already withholds profit from anyone who is not a super admin.
 */
export function AdminProvider({ admin, children }) {
    const value = useMemo(() => {
        const isSuperAdmin = admin?.role === 'superadmin';
        // The server decides this (super admins, or admins one has allowed) and re-checks on every request.
        return { admin, isSuperAdmin, canManageSignature: isSuperAdmin || Boolean(admin?.can_manage_signature) };
    }, [admin]);
    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
    return useContext(AdminContext);
}
