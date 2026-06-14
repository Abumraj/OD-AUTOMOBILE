import React from 'react';

function DepositSection() {
    return (
        <section className="py-xl bg-primary-container relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-md text-center relative z-10">
                <div className="mb-md inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-container/20 border-2 border-secondary-container">
                    <span className="material-symbols-outlined text-secondary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified_user
                    </span>
                </div>
                <h2 className="font-headline-lg text-[22px] md:text-headline-lg text-white mb-sm">
                    Why We Request a <span className="text-secondary-container">$1000</span> Deposit
                </h2>
                <div className="inline-block bg-secondary-container px-md py-xs rounded-full mb-md">
                    <span className="text-on-secondary-container font-bold uppercase tracking-wider text-sm">
                        Deposit (Trust-building)
                    </span>
                </div>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
                    Bidding isn't just competitive, it's time-sensitive. That's why we ask for a <span className="text-white font-bold">$1,000 deposit</span> before bidding begins. It helps us confirm you're ready and lets us move fast once the bid is won.
                </p>
            </div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-secondary-container/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl"></div>
        </section>
    );
}

export default DepositSection;
