import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '@/utils/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // 토큰 유효성 검사 함수
    const checkTokenValidity = async () => {
        try {
            const authData = await userService.getCurrentAuth();
            
            if (authData.isAuthenticated && authData.currentUser) {
                setUser(authData.currentUser);
                setIsAuthenticated(true);
                return true;
            } else {
                // 토큰이 유효하지 않은 경우
                setUser(null);
                setIsAuthenticated(false);
                return false;
            }
        } catch (error) {
            console.error('토큰 유효성 검사 중 오류:', error);
            setUser(null);
            setIsAuthenticated(false);
            return false;
        }
    };

    useEffect(() => {
        // 페이지 로드시 토큰 기반 인증 정보 확인
        const checkAuth = async () => {
            try {
                await checkTokenValidity();
            } catch (error) {
                console.error('인증 확인 중 오류:', error);
            } finally {
                setLoading(false);
            }
        };
        
        checkAuth();

        // 테스트 모드에서는 주기적 토큰 검사 비활성화
        const testMode = true; // 테스트 모드 활성화
        
        // 테스트 모드가 아닐 때만 주기적 토큰 검사 실행
        let tokenCheckInterval;
        if (!testMode) {
            // 주기적으로 토큰 유효성 검사 (1분마다)
            tokenCheckInterval = setInterval(() => {
                if (isAuthenticated) {
                    console.log('주기적 토큰 유효성 검사 실행');
                    checkTokenValidity();
                }
            }, 60000); // 60초마다 실행
        } else {
            console.log('테스트 모드: 주기적 토큰 유효성 검사 비활성화');
        }

        // 컴포넌트 언마운트 시 인터벌 정리
        return () => {
            if (tokenCheckInterval) {
                clearInterval(tokenCheckInterval);
            }
        };
    }, [isAuthenticated]);

    const login = async (email, password) => {
        try {
            const userData = await userService.login(email, password);
            setUser(userData);
            setIsAuthenticated(true);
            return userData;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const newUser = await userService.register(userData);
            return newUser;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await userService.logout();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('로그아웃 중 오류:', error);
            // 오류가 발생해도 로컬 상태는 초기화
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const updateUser = async (userData) => {
        try {
            if (user && user.id) {
                const updatedUser = await userService.updateUser(user.id, userData);
                setUser(updatedUser);
                return updatedUser;
            }
        } catch (error) {
            console.error('사용자 정보 업데이트 중 오류:', error);
            throw error;
        }
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