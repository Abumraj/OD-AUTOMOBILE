import React, { useState, useEffect } from 'react';
import { useScrollAnimation, scaleIn } from '../hooks/useScrollAnimation';

function PerformanceCounter() {
    const [ref, isVisible] = useScrollAnimation();
    const [deliveredCount, setDeliveredCount] = useState('100');

    useEffect(() => {
        fetchPerformanceSettings();
    }, []);

    const fetchPerformanceSettings = async () => {
        try {
            const response = await fetch('/api/performance-settings');
            const data = await response.json();
            setDeliveredCount(data.delivered_cars_count || '100');
        } catch (error) {
            console.error('Error fetching performance settings:', error);
        }
    };

    return (
        <section className="py-xl bg-primary-container border-t border-white/5">
            <div className="max-w-container-max mx-auto px-lg text-center">
                <div ref={ref} className="space-y-sm" style={scaleIn(isVisible)}>
                    <h2 className="font-display-lg text-display-lg text-white">
                        <span className="text-[#f07020] block sm:inline">{deliveredCount}+</span> 
                        {' '}Cars Successfully Delivered Across Africa
                    </h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                        Providing reliable automotive logistics and auction procurement services for clients across the continent.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default PerformanceCounter;
