import React, { createContext, useContext, useState } from 'react';

const ConfirmationContext = createContext(null);

export function ConfirmationProvider({ children }) {
    const [request, setRequest] = useState(null);

    const confirm = (message) => new Promise((resolve) => {
        setRequest({ message, resolve });
    });

    const close = (result) => {
        request?.resolve(result);
        setRequest(null);
    };

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}
            {request && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
                    <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container p-lg shadow-2xl">
                        <h2 id="confirmation-title" className="text-lg font-bold text-white">Confirm deletion</h2>
                        <p className="mt-sm text-on-surface-variant">{request.message}</p>
                        <div className="mt-lg flex justify-end gap-sm">
                            <button type="button" onClick={() => close(false)} className="rounded-lg border border-outline-variant px-md py-sm text-on-surface hover:bg-surface-container-high">Cancel</button>
                            <button type="button" onClick={() => close(true)} className="rounded-lg bg-red-600 px-md py-sm font-bold text-white hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmationContext.Provider>
    );
}

export function useConfirmation() {
    const context = useContext(ConfirmationContext);
    if (!context) throw new Error('useConfirmation must be used inside ConfirmationProvider');
    return context;
}
