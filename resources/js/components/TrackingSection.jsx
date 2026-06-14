import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TrackingSection() {
    const [referenceNumber, setReferenceNumber] = useState('');
    const navigate = useNavigate();

    const handleTrack = () => {
        if (referenceNumber.trim()) {
            navigate(`/tracking?ref=${encodeURIComponent(referenceNumber)}`);
        } else {
            navigate('/tracking');
        }
        // Scroll to top after navigation
        setTimeout(() => window.scrollTo(0, 0), 100);
    };

    return (
        <section className="py-xl bg-primary-container">
            <div className="max-w-container-max mx-auto px-lg">
                <div className="bg-surface-container-low rounded-2xl p-lg flex flex-col md:flex-row items-center gap-lg border border-white/5">
                    <div className="md:w-1/2 space-y-md">
                        <h2 className="font-headline-lg text-[22px] md:text-headline-lg text-white">
                            Real-Time Logistics Tracking
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Monitor every milestone of your vehicle's journey with our high-contrast dashboard. From the auction floor to the final port, we provide 100% transparency.
                        </p>
                        <div className="w-full h-2 bg-primary-container rounded-full overflow-hidden">
                            <div className="h-full bg-secondary-container w-[75%] rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-2 md:flex md:justify-between gap-2 md:gap-0 font-caption text-[10px] md:text-caption text-on-surface-variant uppercase tracking-tighter">
                            <span className="text-center md:text-left">Auction Won</span>
                            <span className="text-center md:text-left">Shipping</span>
                            <span className="text-secondary-container font-bold text-center md:text-left">In Transit</span>
                            <span className="text-center md:text-left">Delivered</span>
                        </div>
                    </div>
                    <div className="md:w-1/2 w-full flex justify-end">
                        <div className="bg-primary-container p-md rounded-xl border border-white/10 w-full max-w-sm">
                            <h4 className="font-label-md text-label-md text-white mb-sm">
                                Track your shipment
                            </h4>
                            <div className="space-y-base">
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="Enter Reference Number" 
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                />
                                <button 
                                    className="w-full bg-secondary-container text-on-secondary-container font-label-md text-label-md py-2 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
                                    onClick={handleTrack}
                                >
                                    Track Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default TrackingSection;
