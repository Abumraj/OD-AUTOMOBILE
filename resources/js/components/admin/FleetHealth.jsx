import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function FleetHealth() {
    const [fleetData, setFleetData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFleetHealth();
    }, []);

    const fetchFleetHealth = async () => {
        try {
            const data = await api.getFleetHealth();
            setFleetData(data);
        } catch (error) {
            console.error('Error fetching fleet health:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-primary-container p-md rounded-xl border border-outline-variant relative overflow-hidden animate-pulse h-80">
                <h3 className="font-title-md text-on-surface mb-md">Fleet Health</h3>
            </div>
        );
    }

    const metrics = [
        { label: 'Carriers Active', value: fleetData?.carriers_active || 0 },
        { label: 'Vessel On-Time Rate', value: fleetData?.vessel_on_time || 0 }
    ];

    return (
        <div className="bg-primary-container p-md rounded-xl border border-outline-variant relative overflow-hidden">
            <h3 className="font-title-md text-on-surface mb-md">Fleet Health</h3>
            <div className="space-y-md">
                {metrics.map((metric, index) => (
                    <div key={index}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-on-surface-variant">{metric.label}</span>
                            <span className="text-secondary">{metric.value}%</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                            <div className="bg-secondary h-full" style={{ width: `${metric.value}%` }}></div>
                        </div>
                    </div>
                ))}
                <div className="pt-md mt-md border-t border-outline-variant/30 text-center">
                    <p className="text-2xl font-bold text-on-surface">{fleetData?.logistics_partners || 0}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Verified Logistics Partners</p>
                    <button className="mt-4 w-full border border-secondary text-secondary py-2 rounded text-xs font-bold hover:bg-secondary hover:text-on-secondary-container transition-all">
                        Manage Partners
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FleetHealth;
