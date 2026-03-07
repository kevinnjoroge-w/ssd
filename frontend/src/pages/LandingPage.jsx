import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { planService } from '../services/api';

const LandingPage = () => {
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await planService.getPlans();
                setPlans(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPlans();
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            {/* Hero Section */}
            <section style={{ textAlign: 'center', margin: '4rem 0' }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }} className="gradient-text">
                    Insurance that moves with you.
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
                    Get instant coverage for yourself and your family. Sign up via Web or dial <span style={{ color: 'var(--primary)', fontWeight: 700 }}>*123#</span> on any phone.
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '16px 32px', fontSize: '1.1rem' }}>
                        Get Protected Now
                    </Link>
                    <button style={{ background: 'var(--surface)', color: 'white', padding: '16px 32px', border: '1px solid var(--glass-border)' }}>
                        Learn More
                    </button>
                </div>
            </section>

            {/* Features */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', margin: '4rem 0' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <Zap color="var(--accent)" size={40} style={{ marginBottom: '1rem' }} />
                    <h3>Instant Activation</h3>
                    <p style={{ color: 'var(--text-muted)' }}>No paperwork. No waiting. Your policy is active the moment you pay.</p>
                </div>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <Smartphone color="var(--primary)" size={40} style={{ marginBottom: '1rem' }} />
                    <h3>USSD + Web</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Access your insurance via our premium web dashboard or via USSD when offline.</p>
                </div>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <Shield color="var(--secondary)" size={40} style={{ marginBottom: '1rem' }} />
                    <h3>Reliable Claims</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Fast claim processing backed by our automated verification system.</p>
                </div>
            </div>

            {/* Plans Section */}
            <section id="plans" style={{ margin: '6rem 0' }}>
                <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }}>Our Insurance Plans</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                    {plans.map((plan) => (
                        <div key={plan.id} className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <span style={{
                                    background: 'rgba(99, 102, 241, 0.1)',
                                    color: 'var(--primary)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase'
                                }}>
                                    {plan.coverage_type}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{plan.name}</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', flex: 1 }}>{plan.description}</p>
                            <div style={{ marginBottom: '2rem' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 800 }}>KES {plan.min_premium}</span>
                                <span style={{ color: 'var(--text-muted)' }}> / month</span>
                            </div>
                            <ul style={{ listStyle: 'none', marginBottom: '2.5rem' }}>
                                {plan.benefits && Object.entries(plan.benefits).map(([key, value]) => (
                                    <li key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                        <CheckCircle size={16} color="var(--secondary)" /> {value}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
                                Get Started <ArrowRight size={18} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
