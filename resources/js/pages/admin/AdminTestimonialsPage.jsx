import React from 'react';
import TestimonialsManager from '../../components/admin/TestimonialsManager';

function AdminTestimonialsPage() {
    return (
        <div className="space-y-gutter">
            <div>
                <h1 className="font-display-sm text-display-sm text-white mb-xs">Testimonials Management</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Review, approve, and feature customer testimonials on your website
                </p>
            </div>

            <TestimonialsManager />
        </div>
    );
}

export default AdminTestimonialsPage;
