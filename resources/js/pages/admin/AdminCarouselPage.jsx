import React from 'react';
import CarouselManager from '../../components/admin/CarouselManager';

function AdminCarouselPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Homepage Carousel</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Manage hero carousel images displayed on the homepage
                </p>
            </div>

            <CarouselManager />
        </div>
    );
}

export default AdminCarouselPage;
