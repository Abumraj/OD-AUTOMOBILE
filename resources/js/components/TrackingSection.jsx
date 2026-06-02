import React, { useState } from 'react';

function TrackingSection() {
    const [referenceNumber, setReferenceNumber] = useState('');

    const handleTrack = () => {
        console.log('Tracking:', referenceNumber);
    };

    return (
        <section className="py-xl bg-primary-container">
            <div className="max-w-container-max mx-auto px-lg">
                <div className="bg-surface-container-low rounded-2xl p-lg flex flex-col md:flex-row items-center gap-lg border border-white/5">
                    <div className="md:w-1/2 space-y-md">
                        <h2 className="font-headline-lg text-headline-lg text-white">
                            Real-Time Logistics Tracking
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                            Monitor every milestone of your vehicle's journey with our high-contrast dashboard. From the auction floor to the final port, we provide 100% transparency.
                        </p>
                        <div className="w-full h-2 bg-primary-container rounded-full overflow-hidden">
                            <div className="h-full bg-secondary-container w-[75%] rounded-full"></div>
                        </div>
                        <div className="flex justify-between font-caption text-caption text-on-surface-variant uppercase tracking-tighter">
                            <span>Auction Won</span>
                            <span>Shipping</span>
                            <span className="text-secondary-container font-bold">In Transit</span>
                            <span>Delivered</span>
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
