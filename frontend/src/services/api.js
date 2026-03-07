import axios from 'axios';

const api = axios.create({
    baseURL: '',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ssd_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (phone, password) => {
        const response = await api.post('/api/users/login', { phone, password });
        if (response.data.data.token) {
            localStorage.setItem('ssd_token', response.data.data.token);
        }
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/api/users/register', userData);
        if (response.data.data.token) {
            localStorage.setItem('ssd_token', response.data.data.token);
        }
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/api/users/me');
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('ssd_token');
    }
};

export const planService = {
    getPlans: async () => {
        const response = await api.get('/api/plans');
        return response.data;
    }
};

export const paymentService = {
    initiateStk: async (paymentData) => {
        const response = await api.post('/api/payments/mpesa/initiate', paymentData);
        return response.data;
    }
};

export const policyService = {
    getMyPolicies: async () => {
        const response = await api.get('/api/policies/me');
        return response.data;
    },
    createPolicy: async (policyData) => {
        const response = await api.post('/api/policies', policyData);
        return response.data;
    }
};

export const analyticsService = {
    getStats: async () => {
        const response = await api.get('/api/analytics/stats');
        return response.data;
    }
};

export default api;
