const auth = {
    async login(email, password) {
        try {
            const data = await api.post('/auth/signin', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            throw error;
        }
    },

    async register(userData) {
        try {
            return await api.post('/auth/signup', userData);
        } catch (error) {
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isLoggedIn() {
        return !!localStorage.getItem('token');
    }
};
