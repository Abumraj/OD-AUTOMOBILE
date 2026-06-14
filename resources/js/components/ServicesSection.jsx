import React from 'react';
import { useScrollAnimation, fadeInUp, slideInLeft, staggerChildren } from '../hooks/useScrollAnimation';

function ServicesSection() {
    const [headerRef, headerVisible] = useScrollAnimation();
    const [gridRef, gridVisible] = useScrollAnimation();

    const services = [
        {
            icon: 'shopping_cart_checkout',
            title: 'Procurement',
            description: 'Expert sourcing and acquisition of vehicles across international auction markets with verified reporting.'
        },
        {
            icon: 'directions_boat',
            title: 'Shipping',
            description: 'Global multi-modal transport solutions focusing on security, speed, and cost-effective routing.'
        },
        {
            icon: 'assignment_turned_in',
            title: 'Port Clearance',
            description: 'Navigating complex customs documentation and regulatory requirements with precision and authority.'
        },
        {
            icon: 'local_shipping',
            title: 'Delivery',
            description: 'Last-mile carrier solutions ensuring your asset arrives safely at your doorstep or specified terminal.'
        }
    ];

    return (
        <section className="py-xl bg-surface-container-lowest">
            <div className="max-container-max mx-auto px-lg">
                <div 
                    ref={headerRef}
                    className="flex flex-col md:flex-row justify-between items-end mb-lg gap-md"
                    style={fadeInUp(headerVisible)}
                >
                    <div className="space-y-xs">
                        <span className="text-secondary-container font-label-md text-label-md tracking-widest uppercase">
                            Our Expertise
                        </span>
                        <h2 className="font-headline-lg text-[22px] md:text-headline-lg text-white">
                            Full-Spectrum Logistics
                        </h2>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                        Systematic approach to information density and modern efficiency for every stage of the automotive lifecycle.
                    </p>
                </div>
                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                    {services.map((service, index) => (
                        <div 
                            key={index} 
                            className="bg-primary-container p-lg rounded-xl border border-white/5 hover:border-secondary-container/50 hover:scale-105 hover:shadow-2xl transition-all group cursor-pointer shadow-xl"
                            style={fadeInUp(gridVisible, staggerChildren(index))}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-md">
                                    <span className="material-symbols-outlined text-secondary-container text-4xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                                        {service.icon}
                                    </span>
                                    <h3 className="font-title-md text-title-md text-white">
                                        {service.title}
                                    </h3>
                                    <p className="font-body-md text-body-md text-on-surface-variant">
                                        {service.description}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-secondary-container group-hover:translate-x-1 transition-all">
                                    arrow_forward
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ServicesSection;
