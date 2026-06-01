import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function QuoteStep4({ formData, prevStep, handleSubmit, submitting }) {
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const onSubmit = (e) => {
        e.preventDefault();
        if (!agreedToTerms) {
            alert('Please agree to the terms of service');
            return;
        }
        handleSubmit();
    };

    const getServiceName = (serviceId) => {
        const services = {
            'procurement': 'Procurement Only',
            'full-service': 'Full Service',
            'shipping': 'Shipping Only'
        };
        return services[serviceId] || serviceId;
    };

    return (
        <div className="w-full max-w-container-max mx-auto px-gutter py-xl">
            <div className="max-w-3xl mx-auto mb-lg">
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary-container -translate-y-1/2 z-0"></div>
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-secondary-container -translate-y-1/2 z-0 scale-x-100 origin-left"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center font-bold">1</div>
                        <span className="mt-xs font-label-md text-label-md text-on-surface-variant">Service</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center font-bold">2</div>
                        <span className="mt-xs font-label-md text-label-md text-on-surface-variant">Vehicle</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center font-bold">3</div>
                        <span className="mt-xs font-label-md text-label-md text-on-surface-variant">Contact</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary ring-4 ring-secondary-container/30 flex items-center justify-center font-bold">4</div>
                        <span className="mt-xs font-label-md text-label-md text-secondary">Summary</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
                <div className="lg:col-span-8 space-y-md">
                    <div className="bg-primary-container border border-white/10 rounded-xl overflow-hidden">
                        <div className="bg-white/5 px-md py-sm border-b border-white/10 flex items-center gap-sm">
                            <span className="material-symbols-outlined text-secondary">description</span>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface">Quote Summary</h2>
                        </div>
                        <div className="p-md space-y-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                                <div>
                                    <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-xs">Selected Service</h3>
                                    <p className="font-title-md text-title-md text-secondary">{getServiceName(formData.service)}</p>
                                    <p className="font-caption text-caption text-on-surface-variant">Premium automotive logistics</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">Vehicle Details</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-md bg-surface-container rounded p-md">
                                    <div>
                                        <p className="font-caption text-caption text-on-surface-variant">Make</p>
                                        <p className="font-body-md text-body-md font-bold">{formData.make}</p>
                                    </div>
                                    <div>
                                        <p className="font-caption text-caption text-on-surface-variant">Model</p>
                                        <p className="font-body-md text-body-md font-bold">{formData.model}</p>
                                    </div>
                                    <div>
                                        <p className="font-caption text-caption text-on-surface-variant">Year</p>
                                        <p className="font-body-md text-body-md font-bold">{formData.year}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                <div className="space-y-sm">
                                    <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Origin</h3>
                                    <div className="flex items-start gap-sm">
                                        <span className="material-symbols-outlined text-on-surface-variant">location_on</span>
                                        <p className="font-body-md text-body-md">{formData.origin}<br/><span className="text-on-surface-variant font-caption">Pick-up Location</span></p>
                                    </div>
                                </div>
                                <div className="space-y-sm">
                                    <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Destination</h3>
                                    <div className="flex items-start gap-sm">
                                        <span className="material-symbols-outlined text-on-surface-variant">flag</span>
                                        <p className="font-body-md text-body-md">{formData.destination}<br/><span className="text-on-surface-variant font-caption">Drop-off Location</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-md">
                                <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">Contact Information</h3>
                                <div className="flex flex-wrap gap-xl">
                                    <div className="flex items-center gap-sm">
                                        <span className="material-symbols-outlined text-on-surface-variant">person</span>
                                        <p className="font-body-md text-body-md">{formData.fullName}</p>
                                    </div>
                                    <div className="flex items-center gap-sm">
                                        <span className="material-symbols-outlined text-on-surface-variant">mail</span>
                                        <p className="font-body-md text-body-md">{formData.email}</p>
                                    </div>
                                    <div className="flex items-center gap-sm">
                                        <span className="material-symbols-outlined text-on-surface-variant">phone</span>
                                        <p className="font-body-md text-body-md">{formData.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <aside className="lg:col-span-4 space-y-md">
                    <div className="bg-surface-container-high border-2 border-secondary-container rounded-xl p-md shadow-xl">
                        <div className="flex items-center justify-between mb-md">
                            <span className="font-label-md text-label-md text-on-surface-variant">Required Deposit</span>
                            <span className="bg-secondary-container/20 text-secondary text-xs px-2 py-1 rounded font-bold">SECURE PAYMENT</span>
                        </div>
                        <div className="text-center mb-md">
                            <span className="font-display-lg text-display-lg text-secondary">$1,000.00</span>
                            <p className="font-caption text-caption text-on-surface-variant mt-xs">Trust-building deposit required to finalize request</p>
                        </div>
                        <div className="bg-primary-container/50 rounded p-sm mb-lg border border-white/5">
                            <div className="flex items-start gap-sm">
                                <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
                                <p className="font-caption text-caption text-on-surface">
                                    The deposit is fully refundable if the quote is not accepted within 24 hours. Secured by OD Automotive Trust Protocol.
                                </p>
                            </div>
                        </div>
                        <form onSubmit={onSubmit} className="space-y-md">
                            <div className="flex items-start gap-sm">
                                <input
                                    type="checkbox"
                                    id="tos"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-1 w-5 h-5 rounded border-outline-variant bg-surface-container focus:ring-secondary text-secondary-container"
                                    disabled={submitting}
                                />
                                <label className="font-caption text-caption text-on-surface-variant leading-tight" htmlFor="tos">
                                    I agree to the <a className="text-secondary underline" href="#">Terms of Service</a>, <a className="text-secondary underline" href="#">Carrier Terms</a>, and authorize the $1,000 trust deposit.
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-secondary-container text-on-secondary py-md rounded-lg font-headline-lg text-title-md font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-secondary-container/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
                            >
                                {submitting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Request'
                                )}
                            </button>
                        </form>
                        <p className="text-center font-caption text-caption text-on-surface-variant mt-md flex items-center justify-center gap-xs">
                            <span className="material-symbols-outlined text-[16px]">lock</span>
                            256-bit SSL Encrypted Connection
                        </p>
                    </div>
                    <div className="bg-primary-container border border-white/10 rounded-xl p-md">
                        <h4 className="font-label-md text-label-md font-bold text-on-surface mb-sm">Why the deposit?</h4>
                        <p className="font-caption text-caption text-on-surface-variant">
                            To maintain our high standards of logistics precision, we require a trust deposit to verify intent. This ensures priority carrier allocation for your vehicle transport.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={prevStep}
                        className="w-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-xs px-md py-sm"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Contact Details
                    </button>
                </aside>
            </div>
        </div>
    );
}

export default QuoteStep4;
