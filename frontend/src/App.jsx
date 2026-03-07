import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PlansPage from './pages/PlansPage';
import Navbar from './components/Navbar';
import { authService } from './services/api';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('ssd_token');
            if (token) {
                try {
                    const res = await authService.getMe();
                    setUser(res.data);
                } catch (err) {
                    localStorage.removeItem('ssd_token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <Router>
            <div className="app-container">
                <div className="hero-mesh"></div>
                <Navbar user={user} setUser={setUser} />
                <main className="content">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage setUser={setUser} />} />
                        <Route path="/register" element={<RegisterPage setUser={setUser} />} />
                        <Route
                            path="/dashboard"
                            element={user ? <CustomerDashboard user={user} /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/plans"
                            element={user ? <PlansPage /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/admin"
                            element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/dashboard" />}
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
