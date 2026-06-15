import React, { useState, useEffect } from 'react';
import { useScrollAnimation, fadeInUp, staggerChildren, scaleIn } from '../hooks/useScrollAnimation';

function AuctionsPage() {
    const [headerRef, headerVisible] = useScrollAnimation();
    const [gridRef, gridVisible] = useScrollAnimation();
    const [depositRef, depositVisible] = useScrollAnimation();
    const [featuredAuctions, setFeaturedAuctions] = useState([]);
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: '',
        max_budget: '',
        currency: 'USD',
        additional_requirements: ''
    });

    useEffect(() => {
        fetchFeaturedAuctions();
    }, []);

    const fetchFeaturedAuctions = async () => {
        try {
            const response = await fetch('/api/auctions/featured');
            const data = await response.json();
            setFeaturedAuctions(data);
        } catch (error) {
            console.error('Error fetching featured auctions:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/auction-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                setFormData({
                    customer_name: '',
                    customer_email: '',
                    customer_phone: '',
                    vehicle_make: '',
                    vehicle_model: '',
                    vehicle_year: '',
                    max_budget: '',
                    additional_requirements: ''
                });
            } else {
                alert('Failed to submit request. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit request. Please try again.');
        }
    };

    const auctionSites = [
        {
            name: 'Copart',
            logo: '🚗',
            description: 'Leading online vehicle auction platform with locations across North America',
            vehicles: '175,000+'
        },
        {
            name: 'IAAI',
            logo: '🏁',
            description: 'Insurance Auto Auctions with extensive salvage and clean title inventory',
            vehicles: '250,000+'
        },
        {
            name: 'Manheim',
            logo: '🔧',
            description: 'World\'s largest wholesale auto auction with dealer-grade vehicles',
            vehicles: '7 Million/year'
        }
    ];

    return (
        <div className="min-h-screen bg-primary-container py-xl">
            <div className="max-w-container-max mx-auto px-4 md:px-lg">
                <div ref={headerRef} className="text-center mb-xl" style={fadeInUp(headerVisible)}>
                    <span className="text-secondary-container font-label-md text-label-md tracking-widest uppercase">
                        Auction Access
                    </span>
                    <h1 className="font-display-lg text-[28px] md:text-display-lg text-white mt-sm mb-md">
                        We Bid On Your Behalf
                    </h1>
                    <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant max-w-3xl mx-auto">
                        Access to premium auction platforms across the United States. We handle the bidding process so you get the best deal.
                    </p>
                </div>

                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
                    {auctionSites.map((site, index) => (
                        <div key={index} className="bg-surface-container-low p-lg rounded-xl border border-white/5 text-center hover:border-secondary-container/50 hover:scale-105 transition-all duration-300" style={fadeInUp(gridVisible, staggerChildren(index))}>
                            <div className="text-6xl mb-md">{site.logo}</div>
                            <h3 className="font-title-md text-title-md text-white mb-sm">
                                {site.name}
                            </h3>
                            <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                                {site.description}
                            </p>
                            <div className="inline-block bg-secondary-container/20 px-md py-xs rounded-full">
                                <span className="text-secondary-container font-label-md text-label-md">
                                    {site.vehicles} vehicles
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div ref={depositRef} className="bg-surface-container-low p-6 md:p-xl rounded-2xl border border-white/5" style={scaleIn(depositVisible)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
                        <div>
                            <h2 className="font-headline-lg text-[22px] md:text-headline-lg text-white mb-md">
                                How It Works
                            </h2>
                            <div className="space-y-md">
                                <div className="flex gap-md">
                                    <div className="flex-shrink-0 w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center">
                                        <span className="text-on-secondary-container font-bold">1</span>
                                    </div>
                                    <div>
                                        <h4 className="font-title-md text-white mb-xs">Tell Us What You Want</h4>
                                        <p className="font-body-md text-on-surface-variant">
                                            Provide vehicle specifications, budget, and preferences
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-md">
                                    <div className="flex-shrink-0 w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center">
                                        <span className="text-on-secondary-container font-bold">2</span>
                                    </div>
                                    <div>
                                        <h4 className="font-title-md text-white mb-xs">$1,000 Deposit</h4>
                                        <p className="font-body-md text-on-surface-variant">
                                            Secure your commitment and authorize us to bid
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-md">
                                    <div className="flex-shrink-0 w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center">
                                        <span className="text-on-secondary-container font-bold">3</span>
                                    </div>
                                    <div>
                                        <h4 className="font-title-md text-white mb-xs">We Find & Bid</h4>
                                        <p className="font-body-md text-on-surface-variant">
                                            Expert bidding on your behalf at major auction houses
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-md">
                                    <div className="flex-shrink-0 w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center">
                                        <span className="text-on-secondary-container font-bold">4</span>
                                    </div>
                                    <div>
                                        <h4 className="font-title-md text-white mb-xs">You Receive Your Vehicle</h4>
                                        <p className="font-body-md text-on-surface-variant">
                                            Complete shipping and delivery to your doorstep
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-primary-container p-lg rounded-xl">
                            <h3 className="font-title-md text-title-md text-white mb-md text-center">
                                Start Your Search
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-base">
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="Your Name" 
                                    type="text"
                                    required
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                                />
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="Email Address" 
                                    type="email"
                                    required
                                    value={formData.customer_email}
                                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                                />
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="Phone Number" 
                                    type="tel"
                                    value={formData.customer_phone}
                                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                                />
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="Vehicle Make" 
                                    type="text"
                                    required
                                    value={formData.vehicle_make}
                                    onChange={(e) => setFormData({...formData, vehicle_make: e.target.value})}
                                />
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="Vehicle Model" 
                                    type="text"
                                    required
                                    value={formData.vehicle_model}
                                    onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                                />
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="Year" 
                                    type="text"
                                    required
                                    value={formData.vehicle_year}
                                    onChange={(e) => setFormData({...formData, vehicle_year: e.target.value})}
                                />
                                <div className="flex gap-2">
                                    <select
                                        className="bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors w-28"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="CAD">CAD</option>
                                        <option value="AUD">AUD</option>
                                        <option value="JPY">JPY</option>
                                    </select>
                                    <input 
                                        className="flex-1 bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                        placeholder="Maximum Budget" 
                                        type="number"
                                        required
                                        value={formData.max_budget}
                                        onChange={(e) => setFormData({...formData, max_budget: e.target.value})}
                                    />
                                </div>
                                <textarea 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="Additional Requirements (Optional)" 
                                    rows="3"
                                    value={formData.additional_requirements}
                                    onChange={(e) => setFormData({...formData, additional_requirements: e.target.value})}
                                ></textarea>
                                <button type="submit" className="w-full bg-secondary-container text-on-secondary-container font-label-md text-label-md py-2.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all">
                                    Request Vehicle Search
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {featuredAuctions.length > 0 && (
                    <div className="mt-xl">
                        <h2 className="font-headline-lg text-[22px] md:text-headline-lg text-white mb-lg text-center">
                            Featured Auctions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                            {featuredAuctions.map((auction) => (
                                <div key={auction.id} className="bg-surface-container-low p-lg rounded-xl border border-white/5 hover:border-secondary-container/50 transition-all">
                                    <div className="flex items-start justify-between mb-md">
                                        <div>
                                            <h3 className="font-title-md text-white mb-xs">
                                                {auction.vehicle}
                                            </h3>
                                            <p className="font-caption text-on-surface-variant">
                                                {auction.auction_platform} • {auction.auction_location}
                                            </p>
                                        </div>
                                        <span className={`px-sm py-xs rounded-full font-caption ${
                                            auction.status === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {auction.status === 'live' ? 'Live' : 'Upcoming'}
                                        </span>
                                    </div>
                                    <div className="space-y-sm mb-md">
                                        {auction.vehicle_mileage && (
                                            <p className="font-body-sm text-on-surface-variant">
                                                <span className="material-symbols-outlined text-sm align-middle mr-xs">speed</span>
                                                {auction.vehicle_mileage.toLocaleString()} miles
                                            </p>
                                        )}
                                        <p className="font-body-sm text-on-surface-variant">
                                            <span className="material-symbols-outlined text-sm align-middle mr-xs">description</span>
                                            {auction.title_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Title
                                        </p>
                                    </div>
                                    <div className="border-t border-white/10 pt-md">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-caption text-on-surface-variant">Current Bid</p>
                                                <p className="font-title-lg text-secondary-container">
                                                    ${parseFloat(auction.current_bid || 0).toLocaleString()}
                                                </p>
                                            </div>
                                            {auction.buy_now_price && (
                                                <div className="text-right">
                                                    <p className="font-caption text-on-surface-variant">Buy Now</p>
                                                    <p className="font-body-md text-white">
                                                        ${parseFloat(auction.buy_now_price).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {auction.auction_end_time && (
                                            <p className="font-caption text-on-surface-variant mt-sm">
                                                Ends: {new Date(auction.auction_end_time).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AuctionsPage;
