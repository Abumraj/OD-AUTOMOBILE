import React from 'react';

function QuoteStep2({ formData, updateFormData, nextStep, prevStep }) {
    const handleChange = (field, value) => {
        updateFormData({ [field]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        nextStep();
    };

    const isFormValid = formData.year && formData.make && formData.model && formData.origin && formData.destination;

    return (
        <div className="flex-grow flex items-center justify-center py-xl px-gutter relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
                <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-secondary blur-3xl"></div>
                <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-tertiary blur-3xl"></div>
            </div>
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden relative z-10 flex flex-col min-h-[700px]">
            <div className="bg-surface-container-lowest p-md border-b border-outline-variant/10">
                <div className="flex justify-between items-center max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-xs">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-white flex items-center justify-center font-bold">1</div>
                        <span className="text-caption font-label-md text-secondary-container">Services</span>
                    </div>
                    <div className="flex-grow h-1 bg-secondary-container mx-4 rounded"></div>
                    <div className="flex flex-col items-center gap-xs">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-white flex items-center justify-center font-bold">2</div>
                        <span className="text-caption font-label-md text-secondary-container">Vehicle</span>
                    </div>
                    <div className="flex-grow h-1 bg-surface-container-highest mx-4 rounded"></div>
                    <div className="flex flex-col items-center gap-xs">
                        <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold">3</div>
                        <span className="text-caption font-label-md text-on-surface-variant">Contact</span>
                    </div>
                    <div className="flex-grow h-1 bg-surface-container-highest mx-4 rounded"></div>
                    <div className="flex flex-col items-center gap-xs">
                        <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold">4</div>
                        <span className="text-caption font-label-md text-on-surface-variant">Summary</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                <div className="bg-white rounded-xl p-lg mb-lg">
                    <div className="mb-lg">
                        <h1 className="font-headline-lg text-headline-lg text-primary-container mb-xs">Vehicle Details</h1>
                        <p className="font-body-md text-body-md text-outline">Provide the specifications of the vehicle you wish to transport.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                        <div className="space-y-xs">
                            <label className="block font-label-md text-label-md text-primary-container">Make *</label>
                            <input
                                type="text"
                                value={formData.make || ''}
                                onChange={(e) => handleChange('make', e.target.value)}
                                placeholder="e.g. Mercedes-Benz"
                                className="w-full p-sm border-2 border-surface-container-highest rounded-lg focus:border-secondary-container focus:ring-0 outline-none transition-colors"
                                required
                            />
                        </div>
                        <div className="space-y-xs">
                            <label className="block font-label-md text-label-md text-primary-container">Model *</label>
                            <input
                                type="text"
                                value={formData.model || ''}
                                onChange={(e) => handleChange('model', e.target.value)}
                                placeholder="e.g. G-Class"
                                className="w-full p-sm border-2 border-surface-container-highest rounded-lg focus:border-secondary-container focus:ring-0 outline-none transition-colors"
                                required
                            />
                        </div>
                        <div className="space-y-xs">
                            <label className="block font-label-md text-label-md text-primary-container">Year *</label>
                            <select
                                value={formData.year || ''}
                                onChange={(e) => handleChange('year', e.target.value)}
                                className="w-full p-sm border-2 border-surface-container-highest rounded-lg focus:border-secondary-container focus:ring-0 outline-none transition-colors appearance-none bg-white"
                                required
                            >
                                <option value="">Select Year</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                                <option value="2022">2022</option>
                                <option value="2021">2021</option>
                                <option value="2020">2020</option>
                            </select>
                        </div>
                        <div className="space-y-xs">
                            <label className="block font-label-md text-label-md text-primary-container">Origin Country *</label>
                            <input
                                type="text"
                                value={formData.origin || ''}
                                onChange={(e) => handleChange('origin', e.target.value)}
                                placeholder="Port of Origin"
                                className="w-full p-sm border-2 border-surface-container-highest rounded-lg focus:border-secondary-container focus:ring-0 outline-none transition-colors"
                                required
                            />
                        </div>
                        <div className="md:col-span-2 space-y-xs">
                            <label className="block font-label-md text-label-md text-primary-container">Destination Address *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.destination || ''}
                                    onChange={(e) => handleChange('destination', e.target.value)}
                                    placeholder="Final Delivery Destination"
                                    className="w-full p-sm pl-10 border-2 border-surface-container-highest rounded-lg focus:border-secondary-container focus:ring-0 outline-none transition-colors"
                                    required
                                />
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">location_on</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-lg p-md bg-secondary-container/10 border border-secondary-container/20 rounded-xl flex items-center gap-md">
                        <div className="w-12 h-12 rounded-full bg-secondary-container text-white flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>shield</span>
                        </div>
                        <div>
                            <h4 className="font-title-md text-title-md text-primary-container">$1,000 Deposit Notice</h4>
                            <p className="font-body-md text-body-md text-on-surface-variant">Trust-building Deposit Required to secure your shipping slot and begin procurement.</p>
                        </div>
                    </div>
                </div>

                <div className="p-md bg-surface-container-lowest border-t border-outline-variant/10 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={prevStep}
                        className="px-4 py-2 border-2 border-primary-container text-primary-container font-bold rounded-lg hover:bg-primary-container/5 transition-colors flex items-center gap-xs"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </button>
                    <div className="flex gap-md">
                        <button type="button" className="px-4 py-2 text-outline font-bold hover:text-primary-container transition-colors">Save Draft</button>
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className="px-6 py-2 bg-secondary-container text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-lg flex items-center gap-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Step
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </form>
            </div>
        </div>
    );
}

export default QuoteStep2;
