import React, { useState, useEffect } from 'react';
import { useScrollAnimation, fadeInUp, scaleIn } from '../hooks/useScrollAnimation';

function TrackingPage() {
    const [referenceNumber, setReferenceNumber] = useState('');
    const [trackingData, setTrackingData] = useState(null);
    const [trackingProviders, setTrackingProviders] = useState([]);
    const [headerRef, headerVisible] = useScrollAnimation();
    const [searchRef, searchVisible] = useScrollAnimation();
    const [resultsRef, resultsVisible] = useScrollAnimation();
    const [providersRef, providersVisible] = useScrollAnimation();
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        fetchTrackingProviders();
    }, []);

    const fetchTrackingProviders = async () => {
        try {
            const response = await fetch('/api/tracking-providers');
            const data = await response.json();
            setTrackingProviders(data);
        } catch (error) {
            console.error('Error fetching tracking providers:', error);
        }
    };

    const handleTrack = async () => {
        if (!referenceNumber.trim()) {
            return;
        }

        setShowResults(false);
        setTrackingData(null);

        try {
            const response = await fetch('/api/tracking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tracking_id: referenceNumber })
            });

            const result = await response.json();

            if (result.success && result.data) {
                setTimeout(() => {
                    setTrackingData(result.data);
                    setShowResults(true);
                }, 300);
            } else {
                alert(result.message || 'Shipment not found. Please check your tracking number and try again.');
            }
        } catch (error) {
            console.error('Error tracking shipment:', error);
            alert('Failed to track shipment. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen bg-primary-container py-xl">
            <div className="max-w-container-max mx-auto px-4 md:px-lg">
                <div ref={headerRef} className="text-center mb-xl" style={fadeInUp(headerVisible)}>
                    <span className="text-secondary-container font-label-md text-label-md tracking-widest uppercase">
                        Shipment Tracking
                    </span>
                    <h1 className="font-display-lg text-[28px] md:text-display-lg text-white mt-sm mb-md">
                        Track Your Vehicle
                    </h1>
                    <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant max-w-3xl mx-auto">
                        Enter your reference number to view real-time updates on your vehicle's journey.
                    </p>
                </div>

                <div ref={searchRef} className="max-w-2xl mx-auto mb-xl px-4 md:px-0" style={scaleIn(searchVisible)}>
                    <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
                        <h3 className="font-title-md text-title-md text-white mb-md">
                            Enter Tracking Details
                        </h3>
                        <div className="space-y-base">
                            <input 
                                className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                placeholder="Enter Reference Number (e.g., OD-2024-001)" 
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                            />
                            <button 
                                className="w-full bg-secondary-container text-on-secondary-container font-label-md text-label-md py-2.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
                                onClick={handleTrack}
                            >
                                Track Shipment
                            </button>
                        </div>
                    </div>
                </div>

                <div ref={providersRef} className="max-w-4xl mx-auto mb-xl" style={fadeInUp(providersVisible)}>
                    <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
                        <h3 className="font-title-md text-title-md text-white mb-md flex items-center gap-sm">
                            <span className="material-symbols-outlined text-secondary-container">
                                public
                            </span>
                            Track with Shipping Partners
                        </h3>
                        <p className="font-body-md text-on-surface-variant mb-md">
                            Track your shipment directly on our shipping partners' websites using your booking or container number.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                            {trackingProviders.map((provider, index) => (
                                <a
                                    key={index}
                                    href={provider.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-primary-container p-md rounded-lg border border-white/10 hover:border-secondary-container/50 hover:scale-105 transition-all duration-300 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-md">
                                        <div className="w-12 h-12 bg-secondary-container/20 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-secondary-container text-2xl">
                                                directions_boat
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-label-md text-white">{provider.name}</h4>
                                            <p className="font-caption text-on-surface-variant">External Tracking</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary-container group-hover:translate-x-1 transition-all">
                                        arrow_forward
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {trackingData && (
                    <div 
                        ref={resultsRef}
                        className="max-w-4xl mx-auto space-y-lg"
                        style={{
                            opacity: showResults ? 1 : 0,
                            transform: showResults ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
                        }}
                    >
                        <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
                            <div className="flex items-center justify-between mb-md">
                                <h3 className="font-title-md text-title-md text-white">
                                    Shipment Status: <span className="text-secondary-container">{trackingData.status}</span>
                                </h3>
                                <span className="bg-secondary-container/20 text-secondary-container px-md py-xs rounded-full font-label-md text-label-md">
                                    {trackingData.progress}% Complete
                                </span>
                            </div>
                            
                            <div className="w-full h-2 bg-primary-container rounded-full overflow-hidden mb-lg">
                                <div className="h-full bg-secondary-container rounded-full transition-all duration-500" style={{width: `${trackingData.progress}%`}}></div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-base">
                                {trackingData.stages.map((stage, index) => (
                                    <div key={index} className="text-center">
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-sm ${stage.completed ? 'bg-secondary-container' : 'bg-surface-container'}`}>
                                            <span className="material-symbols-outlined text-white text-xl" style={stage.completed ? {fontVariationSettings: "'FILL' 1"} : {}}>
                                                {stage.completed ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                        </div>
                                        <p className={`font-caption text-caption uppercase tracking-wider ${stage.completed ? 'text-secondary-container font-bold' : 'text-on-surface-variant'}`}>
                                            {stage.name}
                                        </p>
                                        <p className="font-caption text-caption text-on-surface-variant mt-xs">
                                            {stage.date}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                            <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
                                <h4 className="font-title-md text-title-md text-white mb-md flex items-center gap-sm">
                                    <span className="material-symbols-outlined text-secondary-container">
                                        directions_car
                                    </span>
                                    Vehicle Details
                                </h4>
                                <div className="space-y-sm">
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Vehicle:</span>
                                        <span className="font-body-md text-white">{trackingData.details.vehicle}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Reference:</span>
                                        <span className="font-body-md text-white">{trackingData.reference}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
                                <h4 className="font-title-md text-title-md text-white mb-md flex items-center gap-sm">
                                    <span className="material-symbols-outlined text-secondary-container">
                                        local_shipping
                                    </span>
                                    Shipping Information
                                </h4>
                                <div className="space-y-sm">
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Origin:</span>
                                        <span className="font-body-md text-white">{trackingData.details.origin}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Destination:</span>
                                        <span className="font-body-md text-white">{trackingData.details.destination}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Vessel:</span>
                                        <span className="font-body-md text-white">{trackingData.details.vessel}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">ETA:</span>
                                        <span className="font-body-md text-secondary-container font-bold">{trackingData.details.eta}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TrackingPage;
