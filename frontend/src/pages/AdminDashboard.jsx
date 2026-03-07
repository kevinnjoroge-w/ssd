import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
    Users, Shield, Landmark, TrendingUp, Search, Filter,
    ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { analyticsService } from '../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await analyticsService.getStats();
                setStats(res.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 403) {
                    alert('Access denied. Admin privileges required.');
                    window.location.href = '/dashboard';
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Loading analytics engine...</div>;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem' }}>Analytics Command Center</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time insights across USSD and Web platforms.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{ background: 'var(--surface)', padding: '10px 16px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--glass-border)' }}>
                        <Filter size={18} /> Filter Range
                    </button>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} /> Export Data
                    </button>
                </div>
            </header>

            {/* Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <MetricCard
                    icon={<Users size={24} color="var(--primary)" />}
                    label="Total Users"
                    value={stats.metrics.totalUsers}
                    trend="+12%"
                    isUp={true}
                />
                <MetricCard
                    icon={<Shield size={24} color="var(--secondary)" />}
                    label="Active Policies"
                    value={stats.metrics.activePolicies}
                    trend="+5.4%"
                    isUp={true}
                />
                <MetricCard
                    icon={<Landmark size={24} color="var(--accent)" />}
                    label="Total Revenue"
                    value={`KES ${stats.metrics.totalRevenue.toLocaleString()}`}
                    trend="+18.2%"
                    isUp={true}
                />
                <MetricCard
                    icon={<TrendingUp size={24} color="var(--primary)" />}
                    label="New Users (30d)"
                    value={stats.metrics.newUsersLast30Days}
                    trend="-2%"
                    isUp={false}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                {/* Revenue Chart */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem' }}>Registration Growth</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.planStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Bar dataKey="policyCount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Plan Distribution */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem' }}>Plan Distribution</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.planStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="policyCount"
                                >
                                    {stats.planStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                        {stats.planStats.map((plan, index) => (
                            <div key={plan.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS[index % COLORS.length] }}></div>
                                <span style={{ color: 'var(--text-muted)' }}>{plan.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3>Recent Transactions</h3>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" className="input-field" placeholder="Search transactions..." style={{ paddingLeft: '40px', width: '300px' }} />
                    </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>User</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Amount</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Receipt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.recentTransactions.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 500 }}>{tx.user?.name || 'USSD User'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.user?.phone}</div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>KES {tx.amount}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(tx.created_at).toLocaleString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: tx.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: tx.status === 'completed' ? 'var(--secondary)' : 'var(--accent)'
                                    }}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                    {tx.mpesa_receipt || '---'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value, trend, isUp }) => (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                {icon}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isUp ? 'var(--secondary)' : 'var(--error)', fontSize: '0.875rem', fontWeight: 600 }}>
                {isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {trend}
            </div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit' }}>{value}</div>
    </div>
);

export default AdminDashboard;
