import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Phone, Briefcase, ChevronRight, AlertCircle, Mail } from 'lucide-react';
import { authService } from '../services/api';

const RegisterPage = ({ setUser }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        occupation: '',
        income_range: 'medium',
        password: 'password123' // Default for now
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authService.register(formData);
            setUser(res.data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px' }}>
            <div className="glass-card" style={{ padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '2rem' }}>Join SSD Insure</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Protect your future in minutes</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                name="name"
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                name="phone"
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="0712345678"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                name="email"
                                type="email"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Occupation</label>
                        <div style={{ position: 'relative' }}>
                            <Briefcase size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                name="occupation"
                                type="text"
                                className="input-field"
                                style={{ paddingLeft: '40px' }}
                                placeholder="e.g. Engineer"
                                value={formData.occupation}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Income Range</label>
                        <select
                            name="income_range"
                            className="input-field"
                            value={formData.income_range}
                            onChange={handleChange}
                        >
                            <option value="low">Low (Below 50k)</option>
                            <option value="medium">Medium (50k - 150k)</option>
                            <option value="high">High (Above 150k)</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', padding: '14px', fontSize: '1rem', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Continue to Dashboard'} <ChevronRight size={18} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
