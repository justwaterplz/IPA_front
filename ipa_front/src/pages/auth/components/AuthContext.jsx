import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '@/utils/localStorageDB';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 페이지 로드시 로컬 스토리지에서 인증 정보 확인
        const authData = userService.getCurrentAuth();

        if (authData.isAuthenticated && authData.currentUser) {
            setUser(authData.currentUser);
            setIsAuthenticated(true);
        }

        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const userData = userService.login(email, password);
            setUser(userData);
            setIsAuthenticated(true);
            return userData;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const newUser = userService.register(userData);
            return newUser;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        userService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (userData) => {
        // 실제 구현에서는 API 호출 후 업데이트
        // 현재는 로컬 스토리지 업데이트 로직 없음
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            loading,
            login,
            logout,
            register,
            updateUser
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;