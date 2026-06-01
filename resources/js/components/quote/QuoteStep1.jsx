import React from 'react';

function QuoteStep1({ formData, updateFormData, nextStep }) {
    const services = [
        {
            id: 'procurement',
            icon: 'shopping_cart',
            title: 'Procurement Only',
            description: 'Expert sourcing and auction bidding services to secure your target vehicle at the best price.',
            price: 'Starting at $499'
        },
        {
            id: 'full-service',
            icon: 'stars',
            title: 'Full Service',
            description: 'End-to-end management: Procurement, expert inspection, and door-to-door logistics delivery.',
            price: 'Best Value',
            popular: true
        },
        {
            id: 'shipping',
            icon: 'local_shipping',
            title: 'Shipping Only',
            description: 'Secure transport for a vehicle you\'ve already purchased. Global and domestic logistics available.',
            price: 'Competitive Rates'
        }
    ];

    const handleServiceSelect = (serviceId) => {
        updateFormData({ service: serviceId });
    };

    return (
        <div className="w-full max-w-container-max mx-auto px-gutter py-xl">
            <div className="max-w-3xl mx-auto mb-xl">
                <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary-container -translate-y-1/2 z-0"></div>
                    <div className="absolute top-1/2 left-0 w-1/4 h-1 bg-secondary-container -translate-y-1/2 z-0"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center font-bold border-4 border-primary-container">1</div>
                        <span className="font-label-md text-label-md text-secondary mt-base">Services</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold border-4 border-primary-container">2</div>
                        <span className="font-label-md text-label-md text-on-surface-variant mt-base">Vehicle</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold border-4 border-primary-container">3</div>
                        <span className="font-label-md text-label-md text-on-surface-variant mt-base">Contact</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold border-4 border-primary-container">4</div>
                        <span className="font-label-md text-label-md text-on-surface-variant mt-base">Summary</span>
                    </div>
                </div>
            </div>

            <div className="text-center mb-lg">
                <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Select Your Service</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                    Choose the logistics solution that fits your automotive acquisition or transport needs.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
                {services.map((service) => (
                    <div
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`group relative bg-primary-container rounded-xl p-md flex flex-col gap-md transition-all duration-300 cursor-pointer ${
                            formData.service === service.id
                                ? 'border-2 border-secondary-container shadow-[0_0_20px_rgba(234,107,27,0.15)]'
                                : 'border border-white/5 hover:border-secondary-container/50'
                        }`}
                    >
                        {service.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary-container text-on-secondary text-caption font-bold px-sm py-1 rounded-full uppercase tracking-wider">
                                Most Popular
                            </div>
                        )}
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            formData.service === service.id ? 'bg-secondary-container text-on-secondary' : 'bg-surface-container-high text-secondary-container'
                        }`}>
                            <span className="material-symbols-outlined text-4xl" style={service.popular ? {fontVariationSettings: "'FILL' 1"} : {}}>
                                {service.icon}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-title-md text-title-md text-on-surface mb-xs">{service.title}</h3>
                            <p className="font-body-md text-body-md text-on-surface-variant">{service.description}</p>
                        </div>
                        <div className="mt-auto pt-md flex items-center justify-between">
                            <span className="text-caption font-caption text-secondary">{service.price}</span>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                formData.service === service.id ? 'border-secondary-container' : 'border-outline'
                            }`}>
                                <div className={`w-3 h-3 rounded-full ${
                                    formData.service === service.id ? 'bg-secondary-container' : 'bg-transparent'
                                }`}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center max-w-3xl mx-auto">
                <a href="/" className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-xs px-md py-sm">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Home
                </a>
                <button
                    onClick={nextStep}
                    disabled={!formData.service}
                    className="bg-secondary-container text-on-secondary font-bold px-xl py-sm rounded-lg flex items-center gap-sm hover:opacity-80 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continue to Vehicle Details
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>

            <div className="mt-xl grid grid-cols-1 md:grid-cols-2 gap-md opacity-80">
                <div className="bg-surface-container rounded-lg p-md border border-white/5">
                    <div className="flex items-start gap-md">
                        <span className="material-symbols-outlined text-secondary-container">verified_user</span>
                        <div>
                            <h4 className="font-label-md text-label-md text-on-surface">Insured & Bonded</h4>
                            <p className="font-caption text-caption text-on-surface-variant">
                                Every full-service shipment is protected by our $1M comprehensive transit insurance policy.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-surface-container rounded-lg p-md border border-white/5">
                    <div className="flex items-start gap-md">
                        <span className="material-symbols-outlined text-secondary-container">support_agent</span>
                        <div>
                            <h4 className="font-label-md text-label-md text-on-surface">24/7 Logistics Tracking</h4>
                            <p className="font-caption text-caption text-on-surface-variant">
                                Real-time GPS tracking and dedicated move coordinators for all transport services.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuoteStep1;
