import React, { useState, useEffect, useRef } from 'react';
import { useScrollAnimation, fadeInUp, scaleIn } from '../hooks/useScrollAnimation';
import Toast from '../components/Toast';

function TrackingPage() {
    const [referenceNumber, setReferenceNumber] = useState('');
    const [trackingData, setTrackingData] = useState(null);
    const [headerRef, headerVisible] = useScrollAnimation();
    const [searchRef, searchVisible] = useScrollAnimation();
    const [resultsRef, resultsVisible] = useScrollAnimation();
    const [showResults, setShowResults] = useState(false);
    const [toast, setToast] = useState(null);
    const trackingResultsRef = useRef(null);

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
                    setToast({ message: 'Shipment found successfully!', type: 'success' });
                    
                    // Auto-scroll to tracking results
                    setTimeout(() => {
                        trackingResultsRef.current?.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }, 400);
                }, 300);
            } else {
                setToast({ 
                    message: result.message || 'Shipment not found. Please check your tracking number and try again.', 
                    type: 'error' 
                });
            }
        } catch (error) {
            console.error('Error tracking shipment:', error);
            setToast({ 
                message: 'Failed to track shipment. Please try again later.', 
                type: 'error' 
            });
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
                                placeholder="Enter Reference Number, VIN, or Tracking Number" 
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

                {trackingData && (
                    <div 
                        ref={(el) => {
                            resultsRef.current = el;
                            trackingResultsRef.current = el;
                        }}
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

                        {trackingData.details && trackingData.details.image_link && trackingData.details.image_link !== 'N/A' && trackingData.details.image_link.trim() !== '' && (
                            <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
                                <h4 className="font-title-md text-title-md text-white mb-md flex items-center gap-sm">
                                    <span className="material-symbols-outlined text-secondary-container">
                                        photo_camera
                                    </span>
                                    Vehicle Image
                                </h4>
                                <div className="rounded-lg overflow-hidden bg-surface-container">
                                    <img 
                                        src={trackingData.details.image_link} 
                                        alt={`${trackingData.details.car_model} ${trackingData.details.year}`}
                                        className="w-full h-auto object-cover max-h-96"
                                        onLoad={() => console.log('Image loaded successfully:', trackingData.details.image_link)}
                                        onError={(e) => {
                                            console.error('Image failed to load:', trackingData.details.image_link);
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div class="p-xl text-center text-on-surface-variant"><span class="material-symbols-outlined text-4xl mb-sm">broken_image</span><p>Image not available</p></div>';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

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
                                        <span className="font-body-md text-on-surface-variant">Model:</span>
                                        <span className="font-body-md text-white">{trackingData.details.car_model}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Year:</span>
                                        <span className="font-body-md text-white">{trackingData.details.year}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Color:</span>
                                        <span className="font-body-md text-white">{trackingData.details.car_color}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">VIN:</span>
                                        <span className="font-body-md text-white font-mono text-sm">{trackingData.details.vin}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Reference:</span>
                                        <span className="font-body-md text-white">{trackingData.reference}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Client:</span>
                                        <span className="font-body-md text-white">{trackingData.details.client_name}</span>
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
                                        <span className="font-body-md text-on-surface-variant">Shipping Type:</span>
                                        <span className="font-body-md text-white">{trackingData.details.shipping_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-body-md text-on-surface-variant">Shipping Line:</span>
                                        <span className="font-body-md text-white">{trackingData.details.shipping_line}</span>
                                    </div>
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
                                    {trackingData.details.container_number !== 'N/A' && (
                                        <div className="flex justify-between">
                                            <span className="font-body-md text-on-surface-variant">Container:</span>
                                            <span className="font-body-md text-white font-mono text-sm">{trackingData.details.container_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Professional Action Buttons */}
                        <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
                            <h4 className="font-title-md text-title-md text-white mb-md flex items-center gap-sm">
                                <span className="material-symbols-outlined text-secondary-container">
                                    share
                                </span>
                                Share Tracking Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                {/* WhatsApp Button */}
                                <button
                                    onClick={() => {
                                        const message = `Track my shipment: ${trackingData.reference}\nStatus: ${trackingData.status}\nProgress: ${trackingData.progress}%\n\nTrack here: ${window.location.href}`;
                                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                                        window.open(whatsappUrl, '_blank');
                                        setToast({ message: 'Opening WhatsApp...', type: 'info' });
                                    }}
                                    className="bg-[#25D366] hover:bg-[#20BA5A] text-white px-6 py-4 rounded-lg font-label-md transition-all duration-300 flex items-center justify-center gap-3 group active:scale-95"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                    <span>Share via WhatsApp</span>
                                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                                        arrow_forward
                                    </span>
                                </button>

                                {/* Copy Link Button */}
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        setToast({ message: 'Tracking link copied to clipboard!', type: 'success' });
                                    }}
                                    className="bg-surface-container hover:bg-surface-container-high text-white px-6 py-4 rounded-lg font-label-md transition-all duration-300 flex items-center justify-center gap-3 border border-white/20 group active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-2xl text-secondary-container">
                                        link
                                    </span>
                                    <span>Copy Tracking Link</span>
                                    <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">
                                        content_copy
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
        </div>
    );
}

export default TrackingPage;
