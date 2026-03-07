import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, LogOut, User as UserIcon, BarChart3 } from 'lucide-react';
import { authService } from '../services/api';

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        setUser(null);
        navigate('/');
    };

    return (
        <nav className="glass-card" style={{
            margin: '1rem',
            padding: '0.75rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: '1rem',
            zIndex: 100
        }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white' }}>
                <Shield size={32} color="var(--primary)" />
                <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit' }}>SSD <span style={{ color: 'var(--primary)' }}>INSURE</span></span>
            </Link>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
                {user ? (
                    <>
                        <Link to="/plans" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                            <Shield size={18} /> Plans
                        </Link>
                        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>
                        {user.role === 'admin' && (
                            <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                                <BarChart3 size={18} /> Admin
                            </Link>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.name}</span>
                            <button onClick={handleLogout} className="btn-logout" style={{ background: 'transparent', color: 'var(--error)', padding: '4px' }}>
                                <LogOut size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/login" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500, padding: '8px 16px' }}>Login</Link>
                        <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Get Protected</Link>
                    </div>
                )}
            </div>
        </nav >
    );
};

export default Navbar;
