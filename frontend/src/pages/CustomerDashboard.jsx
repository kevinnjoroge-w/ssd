import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { policyService, paymentService } from '../services/api';
import { Shield, Plus, CreditCard, Zap, Loader2 } from 'lucide-react';

const CustomerDashboard = ({ user }) => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const policyRes = await policyService.getMyPolicies();
            setPolicies(policyRes.data);
        } catch (err) {
            console.error('Fetch data error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayNow = async (policyId, amount) => {
        try {
            await paymentService.initiateStk({
                userId: user.id,
                policyId: policyId,
                amount: amount,
                phoneNumber: user.phone,
                description: `Premium payment for policy ${policyId.substring(0, 8)}`
            });
            alert('Payment request sent to your phone. Please enter your M-Pesa PIN.');
        } catch (err) {
            alert('Failed to initiate payment. Please try again.');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
    );

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Your Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your protection and coverages</p>
                </div>
                <Link to="/plans" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Plus size={20} /> Buy New Insurance
                </Link>
            </header>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {/* User Stats Card */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                                {user.name ? user.name[0] : 'U'}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem' }}>{user.name}</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user.phone}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Email</span>
                                <span style={{ wordBreak: 'break-all' }}>{user.email || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Active Policies</span>
                                <span style={{ fontWeight: 600 }}>{policies.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Member Since</span>
                                <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '2rem', background: 'rgba(99, 102, 241, 0.05)' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Zap size={18} color="var(--primary)" /> Quick Actions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem' }}>Update Profile</button>
                            <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem' }}>File a Claim</button>
                            <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem' }}>Support Chat</button>
                        </div>
                    </div>
                </aside>

                {/* Policies Section */}
                <section style={{ gridColumn: 'span 2' }}>
                    {policies.length === 0 ? (
                        <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                <Shield size={64} strokeWidth={1} style={{ margin: '0 auto' }} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Active Policies</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                                Protect yourself and your loved ones today. Browse our insurance plans tailored for your needs.
                            </p>
                            <Link to="/plans" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                Browse Insurance Plans
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <Shield size={24} color="var(--primary)" /> Your Active Coverages
                            </h2>
                            {policies.map(policy => (
                                <div key={policy.id} className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', flexShrink: 0 }}>
                                            <Shield size={32} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{policy.plan?.name}</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Policy: {policy.policy_number}</p>
                                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.875rem' }}>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                                                    <span style={{ color: 'var(--success)', fontWeight: 600, textTransform: 'capitalize' }}>{policy.status}</span>
                                                </div>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)' }}>Coverage: </span>
                                                    <span style={{ fontWeight: 600 }}>KES {policy.coverage_amount ? policy.coverage_amount.toLocaleString() : '0'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>KES {policy.premium}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> /month</span>
                                        </div>
                                        <button
                                            onClick={() => handlePayNow(policy.id, policy.premium)}
                                            className="btn-primary"
                                            style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <CreditCard size={18} /> Pay Premium
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default CustomerDashboard;
