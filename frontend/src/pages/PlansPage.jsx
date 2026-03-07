import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { planService, policyService, paymentService } from '../services/api';
import { Shield, Check, ArrowRight, Loader2, Info } from 'lucide-react';

const PlansPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [purchasing, setPurchasing] = useState(false);
    const [step, setStep] = useState(1); // 1: Browse, 2: Details/Beneficiary, 3: Payment
    const [selectedPremium, setSelectedPremium] = useState(0);
    const [beneficiary, setBeneficiary] = useState({ name: '', phone: '' });
    const [purchaseError, setPurchaseError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await planService.getPlans();
            setPlans(res.data);
        } catch (err) {
            console.error('Fetch plans error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setStep(2);
    };

    const handlePurchase = async () => {
        setPurchasing(true);
        setPurchaseError('');
        try {
            // 1. Create Policy
            const policyRes = await policyService.createPolicy({
                planId: selectedPlan.id,
                premium: selectedPlan.min_premium,
                coverageAmount: selectedPlan.max_coverage
            });

            const policy = policyRes.data;

            // 2. Initiate Payment (M-Pesa)
            await paymentService.initiateStk({
                userId: policy.user_id,
                amount: policy.premium,
                phoneNumber: '', // Backend will use user's phone if empty, or we can prompt
                description: `Premium for ${selectedPlan.name}`
            });

            alert('Policy created! Please check your phone for the M-Pesa STK push to complete payment.');
            navigate('/dashboard');
        } catch (err) {
            setPurchaseError(err.response?.data?.error || 'Failed to complete purchase');
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
            {step === 1 && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Choose Your Protection</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>Select a plan that fits your lifestyle and budget.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {plans.map((plan) => (
                            <div key={plan.id} className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                                        <Shield size={24} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.75rem', borderRadius: '99px', background: 'var(--glass-border)', color: 'var(--text-muted)' }}>
                                        {plan.coverage_type}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{plan.description}</p>

                                <div style={{ marginBottom: '2rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>KES {Math.round(plan.min_premium)}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}> /month</span>
                                </div>

                                <div style={{ flex: 1, marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                        <Check size={16} color="var(--success)" />
                                        <span>Up to KES {Math.round(plan.max_coverage).toLocaleString()} cover</span>
                                    </div>
                                    {plan.benefits && (() => {
                                        const benefitsArray = typeof plan.benefits === 'string' ? JSON.parse(plan.benefits) : plan.benefits;
                                        return Array.isArray(benefitsArray) ? benefitsArray.map((benefit, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                                <Check size={16} color="var(--success)" />
                                                <span>{benefit}</span>
                                            </div>
                                        )) : null;
                                    })()}
                                </div>

                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    className="btn-primary"
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    Select Plan <ArrowRight size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {step === 2 && selectedPlan && (
                <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                    <button
                        onClick={() => setStep(1)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}
                    >
                        ← Back to Plans
                    </button>

                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Finalize Your {selectedPlan.name} Plan</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Please provide additional details for your insurance policy.</p>

                    <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Beneficiary Full Name</label>
                            <input
                                type="text"
                                required
                                className="glass-card"
                                style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem' }}
                                value={beneficiary.name}
                                onChange={(e) => setBeneficiary({ ...beneficiary, name: e.target.value })}
                                placeholder="Person to receive benefits"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Beneficiary Phone Number</label>
                            <input
                                type="tel"
                                required
                                className="glass-card"
                                style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem' }}
                                value={beneficiary.phone}
                                onChange={(e) => setBeneficiary({ ...beneficiary, phone: e.target.value })}
                                placeholder="e.g. 0712345678"
                            />
                        </div>

                        <div className="glass-card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1.5rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                <Info size={18} />
                                <span style={{ fontWeight: 600 }}>Coverage Summary</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                You are purchasing the <strong>{selectedPlan.name}</strong> plan with a monthly premium of <strong>KES {selectedPlan.min_premium}</strong>.
                                Maximum benefit amount is <strong>KES {selectedPlan.max_coverage.toLocaleString()}</strong>.
                            </p>
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                            Proceed to Payment
                        </button>
                    </form>
                </div>
            )}

            {step === 3 && selectedPlan && (
                <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem', textAlign: 'center' }}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', width: 'fit-content', margin: '0 auto 1.5rem' }}>
                            <Shield size={48} />
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Confirm Purchase</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Securely pay via M-Pesa STK Push</p>
                    </div>

                    <div style={{ background: 'var(--glass)', borderRadius: '16px', padding: '2rem', marginBottom: '2.5rem', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Plan</span>
                            <span style={{ fontWeight: 600 }}>{selectedPlan.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Beneficiary</span>
                            <span style={{ fontWeight: 600 }}>{beneficiary.name}</span>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Total to Pay</span>
                            <span className="gradient-text" style={{ fontWeight: 700, fontSize: '1.25rem' }}>KES {selectedPlan.min_premium}</span>
                        </div>
                    </div>

                    {purchaseError && (
                        <div style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontSize: '0.875rem' }}>
                            {purchaseError}
                        </div>
                    )}

                    <button
                        onClick={handlePurchase}
                        disabled={purchasing}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1.25rem', fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
                    >
                        {purchasing ? (
                            <>
                                <Loader2 className="animate-spin" size={24} /> Initiating Payment...
                            </>
                        ) : (
                            'Confirm & Pay Now'
                        )}
                    </button>

                    <button
                        onClick={() => setStep(2)}
                        disabled={purchasing}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default PlansPage;
