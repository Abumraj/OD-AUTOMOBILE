import React, { useState, useEffect } from 'react';
import QuoteStep1 from '../components/quote/QuoteStep1';
import QuoteStep2 from '../components/quote/QuoteStep2';
import QuoteStep3 from '../components/quote/QuoteStep3';
import QuoteStep4 from '../components/quote/QuoteStep4';
import api from '../services/api';

function QuotePage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formData, setFormData] = useState({
        service: '',
        year: '',
        make: '',
        model: '',
        origin: '',
        destination: '',
        fullName: '',
        email: '',
        phone: '',
        contactMethod: ''
    });

    const updateFormData = (data) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const nextStep = () => {
        setCurrentStep(prev => Math.min(prev + 1, 4));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await api.submitQuote(formData);
            console.log('Quote submitted successfully:', response);
            setSubmitSuccess(true);
        } catch (error) {
            console.error('Error submitting quote:', error);
            alert('Failed to submit quote. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const [successVisible, setSuccessVisible] = useState(false);

    useEffect(() => {
        if (submitSuccess) {
            setSuccessVisible(true);
        }
    }, [submitSuccess]);

    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-primary-container flex items-center justify-center p-gutter">
                <div 
                    className="max-w-2xl w-full bg-surface-container rounded-xl p-xl text-center"
                    style={{
                        opacity: successVisible ? 1 : 0,
                        transform: successVisible ? 'scale(1)' : 'scale(0.9)',
                        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
                    }}
                >
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-md">
                        <span className="material-symbols-outlined text-green-400 text-5xl" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Quote Request Submitted!</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg">
                        Thank you for your request. Our team will review your information and contact you within 24 hours with a detailed quote.
                    </p>
                    <div className="bg-primary-container/50 rounded-lg p-md mb-lg">
                        <p className="font-body-md text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm align-middle mr-1">mail</span>
                            A confirmation email has been sent to <strong className="text-on-surface">{formData.email}</strong>
                        </p>
                    </div>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="bg-secondary-container text-on-secondary px-xl py-sm rounded-lg font-bold hover:opacity-90 transition-all"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary-container">
            {currentStep === 1 && (
                <QuoteStep1
                    formData={formData}
                    updateFormData={updateFormData}
                    nextStep={nextStep}
                />
            )}
            {currentStep === 2 && (
                <QuoteStep2
                    formData={formData}
                    updateFormData={updateFormData}
                    nextStep={nextStep}
                    prevStep={prevStep}
                />
            )}
            {currentStep === 3 && (
                <QuoteStep3
                    formData={formData}
                    updateFormData={updateFormData}
                    nextStep={nextStep}
                    prevStep={prevStep}
                />
            )}
            {currentStep === 4 && (
                <QuoteStep4
                    formData={formData}
                    prevStep={prevStep}
                    handleSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}
        </div>
    );
}

export default QuotePage;
