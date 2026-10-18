import React, { createContext, useContext, useMemo } from 'react';

const AdminContext = createContext({ admin: null, isSuperAdmin: false });

/**
 * Who is signed in to the admin dashboard. Hiding things here is only a convenience:
 * the API already withholds profit from anyone who is not a super admin.
 */
export function AdminProvider({ admin, children }) {
    const value = useMemo(() => ({ admin, isSuperAdmin: admin?.role === 'superadmin' }), [admin]);
    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
    return useContext(AdminContext);
}
