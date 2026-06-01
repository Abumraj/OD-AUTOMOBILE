import React from 'react';
import AuctionManager from '../../components/admin/AuctionManager';

function AdminAuctionsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Auction Management</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Manage vehicle auctions, track bids, and handle customer requests
                </p>
            </div>

            <AuctionManager />
        </div>
    );
}

export default AdminAuctionsPage;
