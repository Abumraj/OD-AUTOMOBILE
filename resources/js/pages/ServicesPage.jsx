import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScrollAnimation, fadeInUp, staggerChildren } from '../hooks/useScrollAnimation';
import YouTubeEmbed from '../components/YouTubeEmbed';

function ServicesPage() {
    const [headerRef, headerVisible] = useScrollAnimation();
    const [gridRef, gridVisible] = useScrollAnimation();
    const [ctaRef, ctaVisible] = useScrollAnimation();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            console.log('Fetching services from /api/services...');
            const response = await fetch('/api/services');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Services API response:', data);
            console.log('Is array?', Array.isArray(data));
            
            if (!Array.isArray(data)) {
                throw new Error('API did not return an array');
            }
            
            const activeServices = data.filter(s => s.is_active);
            console.log('Active services:', activeServices);
            setServices(activeServices);
        } catch (error) {
            console.error('Error fetching services:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary-container py-xl flex items-center justify-center">
                <div className="animate-pulse text-on-surface-variant">Loading services...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-primary-container py-xl flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 font-body-lg mb-md">Error loading services</p>
                    <p className="text-on-surface-variant">{error}</p>
                    <button 
                        onClick={fetchServices}
                        className="mt-md bg-secondary-container text-on-secondary-container px-lg py-sm rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary-container py-xl">
            <div className="max-w-container-max mx-auto px-lg">
                <div ref={headerRef} className="text-center mb-xl" style={fadeInUp(headerVisible)}>
                    <span className="text-secondary-container font-label-md text-label-md tracking-widest uppercase">
                        Our Services
                    </span>
                    <h1 className="font-display-lg text-display-lg text-white mt-sm mb-md">
                        Complete Automotive Logistics Solutions
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mx-auto">
                        From auction floor to your doorstep, we handle every aspect of the automotive import process with precision and professionalism.
                    </p>
                </div>

                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                    {services.length > 0 ? (
                        services.map((service, index) => (
                            <div key={service.id} className="bg-surface-container-low p-lg rounded-xl border border-white/5 hover:border-secondary-container/50 hover:scale-105 transition-all duration-300" style={fadeInUp(gridVisible, staggerChildren(index))}>
                                <div className="flex items-start gap-md mb-md">
                                    <div className="bg-secondary-container/20 p-md rounded-xl">
                                        <span className="material-symbols-outlined text-secondary-container text-5xl">
                                            {service.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="font-title-md text-title-md text-white mb-sm">
                                            {service.title}
                                        </h2>
                                        <p className="font-body-md text-body-md text-on-surface-variant">
                                            {service.description}
                                        </p>
                                    </div>
                                </div>
                                
                                {service.youtube_video_id && (
                                    <div className="mb-md">
                                        <YouTubeEmbed videoId={service.youtube_video_id} title={service.title} />
                                    </div>
                                )}
                                
                                <ul className="space-y-sm">
                                    {service.features && service.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-sm">
                                            <span className="material-symbols-outlined text-secondary-container text-xl mt-xs">
                                                check_circle
                                            </span>
                                            <span className="font-body-md text-body-md text-on-surface-variant">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-xl">
                            <p className="text-on-surface-variant font-body-lg">No services available at the moment.</p>
                        </div>
                    )}
                </div>

                <div ref={ctaRef} className="mt-xl text-center" style={fadeInUp(ctaVisible)}>
                    <Link to="/quote" className="inline-block bg-secondary-container text-on-secondary-container font-label-md text-label-md px-xl py-md rounded-xl hover:opacity-90 hover:scale-105 transition-all shadow-lg active:scale-95">
                        Request a Quote
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ServicesPage;
