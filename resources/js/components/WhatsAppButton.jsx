import React, { useState, useEffect } from 'react';

function WhatsAppButton() {
    const [whatsappUrl, setWhatsappUrl] = useState('#');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        fetchWhatsAppSettings();
    }, []);

    const fetchWhatsAppSettings = async () => {
        try {
            const response = await fetch('/api/whatsapp-settings');
            const data = await response.json();
            
            if (data.phone) {
                const cleanPhone = data.phone.replace(/[^0-9+]/g, '');
                const message = encodeURIComponent(data.message || 'Hello! I would like to inquire about your auto import services.');
                setWhatsappUrl(`https://wa.me/${cleanPhone}?text=${message}`);
                setIsVisible(true);
            }
        } catch (error) {
            console.error('Error fetching WhatsApp settings:', error);
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <a 
            aria-label="WhatsApp Us" 
            className="fixed bottom-md right-md z-[100] flex items-center justify-center w-16 h-16 bg-[#25D366] rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group" 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
        >
            <svg fill="white" height="32" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.548 0 10.058-4.51 10.06-10.059 0-2.689-1.047-5.215-2.947-7.115s-4.426-2.945-7.114-2.945c-5.549 0-10.059 4.51-10.061 10.059-.001 2.224.637 4.393 1.83 6.256l-1.093 3.993 4.144-1.086c.001-.001.001-.001.001-.001zm11.367-7.635c-.31-.155-1.837-.906-2.121-1.01-.284-.104-.49-.155-.698.156-.206.311-.798 1.01-.978 1.218-.18.208-.36.233-.67.078-.31-.155-1.308-.482-2.491-1.538-.919-.819-1.54-1.831-1.72-2.142-.18-.311-.019-.479.136-.633l.453-.527c.15-.174.2-.299.3-.499.1-.2.05-.375-.025-.53-.075-.156-.698-1.685-.956-2.307-.251-.605-.506-.523-.698-.533l-.596-.011c-.206 0-.542.077-.826.388-.284.311-1.085 1.062-1.085 2.592 0 1.53 1.111 3.01 1.266 3.218.155.207 2.186 3.339 5.297 4.682.74.32 1.317.51 1.767.653.743.236 1.419.203 1.953.123.595-.089 1.837-.751 2.096-1.478.258-.727.258-1.348.181-1.477-.077-.13-.284-.207-.594-.362z"></path>
            </svg>
        </a>
    );
}

export default WhatsAppButton;
