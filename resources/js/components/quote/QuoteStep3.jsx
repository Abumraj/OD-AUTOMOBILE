import React from 'react';

function QuoteStep3({ formData, updateFormData, nextStep, prevStep }) {
    const handleChange = (field, value) => {
        updateFormData({ [field]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        nextStep();
    };

    const isFormValid = formData.fullName && formData.email && formData.phone && formData.contactMethod;

    return (
        <div className="min-h-screen bg-[#050533] flex flex-col items-center py-xl px-4 md:px-gutter relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-secondary/10 blur-[100px] rounded-full"></div>

            <div className="w-full max-w-[640px] z-10 px-4 sm:px-0">
                <div className="mb-xl">
                    <div className="flex items-center justify-between mb-sm">
                        <span className="font-label-md text-label-md text-secondary">Step 3 of 4: Contact Details</span>
                        <span className="font-label-md text-label-md text-on-surface-variant">75% Complete</span>
                    </div>
                    <div className="h-1 bg-primary-container rounded-full overflow-hidden">
                        <div className="h-full bg-secondary-container transition-all duration-500 w-[75%]"></div>
                    </div>
                </div>

                <div className="mb-lg">
                    <h1 className="font-headline-lg text-[22px] md:text-headline-lg text-on-surface mb-xs">Almost there.</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                        Please provide your contact information so our logistics experts can reach out with your custom quote.
                    </p>
                </div>

                <div className="bg-white rounded-xl p-md md:p-lg shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-md">
                        <div>
                            <label className="block font-label-md text-label-md text-primary-container mb-xs" htmlFor="fullName">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={formData.fullName || ''}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-gray-900 p-sm focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-label-md text-primary-container mb-xs" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email || ''}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="john@example.com"
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-gray-900 p-sm focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-label-md text-primary-container mb-xs" htmlFor="phone">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={formData.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-gray-900 p-sm focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-label-md text-label-md text-primary-container mb-sm">
                                Preferred Contact Method
                            </label>
                            <div className="grid grid-cols-2 gap-sm">
                                <label className="flex items-center gap-sm p-sm border border-outline-variant/20 rounded cursor-pointer hover:bg-primary-container/5 transition-colors group">
                                    <input
                                        type="radio"
                                        name="contactMethod"
                                        value="email"
                                        checked={formData.contactMethod === 'email'}
                                        onChange={(e) => handleChange('contactMethod', e.target.value)}
                                        className="text-secondary-container focus:ring-secondary-container"
                                    />
                                    <span className="font-body-md text-body-md text-surface group-hover:text-primary-container">Email</span>
                                </label>
                                <label className="flex items-center gap-sm p-sm border border-outline-variant/20 rounded cursor-pointer hover:bg-primary-container/5 transition-colors group">
                                    <input
                                        type="radio"
                                        name="contactMethod"
                                        value="phone"
                                        checked={formData.contactMethod === 'phone'}
                                        onChange={(e) => handleChange('contactMethod', e.target.value)}
                                        className="text-secondary-container focus:ring-secondary-container"
                                    />
                                    <span className="font-body-md text-body-md text-surface group-hover:text-primary-container">Phone Call</span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-md mt-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-md border-t border-outline-variant/10">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="flex items-center justify-center gap-xs text-primary-container font-bold px-4 py-2 hover:bg-primary-container/5 transition-all rounded group"
                            >
                                <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                <span className="text-sm sm:text-base">Previous</span>
                            </button>
                            <button
                                type="submit"
                                disabled={!isFormValid}
                                className="bg-secondary-container text-on-secondary px-6 sm:px-xl py-2.5 sm:py-3 font-bold hover:opacity-90 active:scale-95 transition-all rounded-lg flex items-center justify-center gap-sm shadow-lg shadow-secondary-container/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                Next Step
                                <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>arrow_forward</span>
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-lg flex items-center justify-center gap-md opacity-60">
                    <div className="flex items-center gap-xs">
                        <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                        <span className="font-caption text-caption text-on-surface">Data Encrypted</span>
                    </div>
                    <div className="flex items-center gap-xs">
                        <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>lock</span>
                        <span className="font-caption text-caption text-on-surface">Secure Quote Flow</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuoteStep3;
