import React, { useState, useEffect } from 'react';
import { useScrollAnimation, fadeInUp, slideInLeft, slideInRight } from '../hooks/useScrollAnimation';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: ''
    });
    const [settings, setSettings] = useState({
        contact_email: 'info@odautomotive.com',
        contact_phone: '+234 XXX XXX XXXX',
        contact_location: 'Serving clients across Africa',
        business_hours_weekday: '9:00 AM - 6:00 PM',
        business_hours_saturday: '10:00 AM - 4:00 PM',
        business_hours_sunday: 'Closed',
        contact_page_title: 'Contact Us',
        contact_page_subtitle: 'Have questions about our services? Ready to start your automotive import journey? We\'re here to help.'
    });
    const [whatsappSettings, setWhatsappSettings] = useState({ phone: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const { toast, showToast, hideToast } = useToast();
    const [headerRef, headerVisible] = useScrollAnimation();
    const [leftRef, leftVisible] = useScrollAnimation();
    const [rightRef, rightVisible] = useScrollAnimation();

    useEffect(() => {
        fetchContactSettings();
        fetchWhatsAppSettings();
    }, []);

    const fetchContactSettings = async () => {
        try {
            const response = await fetch('/api/contact-settings');
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching contact settings:', error);
        }
    };

    const fetchWhatsAppSettings = async () => {
        try {
            const response = await fetch('/api/whatsapp-settings');
            const data = await response.json();
            setWhatsappSettings(data);
        } catch (error) {
            console.error('Error fetching WhatsApp settings:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showToast('Thank you! We will contact you soon.', 'success');
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    service: '',
                    message: ''
                });
            } else {
                showToast('Failed to send message. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error submitting contact form:', error);
            showToast('Failed to send message. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-primary-container py-xl">
            <div className="max-w-container-max mx-auto px-4 md:px-lg">
                <div ref={headerRef} className="text-center mb-xl" style={fadeInUp(headerVisible)}>
                    <span className="text-secondary-container font-label-md text-label-md tracking-widest uppercase">
                        Get In Touch
                    </span>
                    <h1 className="font-display-lg text-[28px] md:text-display-lg text-white mt-sm mb-md">
                        {settings.contact_page_title}
                    </h1>
                    <p className="font-body-lg text-base md:text-body-lg text-on-surface-variant max-w-3xl mx-auto">
                        {settings.contact_page_subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                    <div ref={leftRef} className="space-y-lg" style={slideInLeft(leftVisible)}>
                        <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
                            <h3 className="font-title-md text-title-md text-white mb-md">
                                Contact Information
                            </h3>
                            <div className="space-y-md">
                                <div className="flex items-start gap-md">
                                    <span className="material-symbols-outlined text-secondary-container text-2xl">
                                        email
                                    </span>
                                    <div>
                                        <p className="font-label-md text-on-surface-variant">Email</p>
                                        <p className="font-body-md text-white">{settings.contact_email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-md">
                                    <span className="material-symbols-outlined text-secondary-container text-2xl">
                                        phone
                                    </span>
                                    <div>
                                        <p className="font-label-md text-on-surface-variant">Phone</p>
                                        <p className="font-body-md text-white">{settings.contact_phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-md">
                                    <span className="material-symbols-outlined text-secondary-container text-2xl">
                                        location_on
                                    </span>
                                    <div>
                                        <p className="font-label-md text-on-surface-variant">Location</p>
                                        <p className="font-body-md text-white">{settings.contact_location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-container-low p-lg rounded-xl border border-white/5">
                            <h3 className="font-title-md text-title-md text-white mb-md">
                                Business Hours
                            </h3>
                            <div className="space-y-sm">
                                <div className="flex justify-between">
                                    <span className="font-body-md text-on-surface-variant">Monday - Friday</span>
                                    <span className="font-body-md text-white">{settings.business_hours_weekday}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-body-md text-on-surface-variant">Saturday</span>
                                    <span className="font-body-md text-white">{settings.business_hours_saturday}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-body-md text-on-surface-variant">Sunday</span>
                                    <span className="font-body-md text-white">{settings.business_hours_sunday}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-secondary-container/20 p-lg rounded-xl border border-secondary-container/30">
                            <div className="flex items-start gap-md">
                                <span className="material-symbols-outlined text-secondary-container text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>
                                    chat
                                </span>
                                <div>
                                    <h4 className="font-title-md text-white mb-sm">WhatsApp Support</h4>
                                    <p className="font-body-md text-on-surface-variant mb-md">
                                        For immediate assistance, chat with us on WhatsApp
                                    </p>
                                    {whatsappSettings.phone && (
                                        <a 
                                            href={`https://wa.me/${whatsappSettings.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(whatsappSettings.message)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-sm bg-[#25D366] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all"
                                        >
                                            <span className="font-label-md text-label-md">Chat Now</span>
                                            <span className="material-symbols-outlined text-xl">
                                                arrow_forward
                                            </span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div ref={rightRef} className="bg-surface-container-low p-lg rounded-xl border border-white/5" style={slideInRight(rightVisible)}>
                        <h3 className="font-title-md text-title-md text-white mb-md">
                            Send Us a Message
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-base">
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Full Name *
                                </label>
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="John Doe" 
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Email Address *
                                </label>
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="john@example.com" 
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Phone Number *
                                </label>
                                <input 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors" 
                                    placeholder="+234 XXX XXX XXXX" 
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Service Interested In *
                                </label>
                                <select 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors"
                                    name="service"
                                    value={formData.service}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a service</option>
                                    <option value="procurement">Procurement</option>
                                    <option value="shipping">Shipping</option>
                                    <option value="clearance">Port Clearance</option>
                                    <option value="delivery">Delivery</option>
                                    <option value="complete">Complete Package</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-label-md text-on-surface-variant mb-xs">
                                    Message
                                </label>
                                <textarea 
                                    className="w-full bg-surface-container-lowest border border-white/20 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-secondary-container transition-colors min-h-[120px]" 
                                    placeholder="Tell us about your requirements..."
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                            <button 
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-secondary-container text-on-secondary-container font-label-md text-label-md py-2.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={hideToast} 
                />
            )}
        </div>
    );
}

export default ContactPage;
