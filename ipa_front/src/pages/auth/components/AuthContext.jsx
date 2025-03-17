import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '@/utils/apiService';

const AuthContext = createContext(null);

export const USER_ROLES = {
  GUEST: 'guest',       // 로그인하지 않은 사용자
  PENDING: 'pending',   // 승인 대기 중인 사용자
  USER: 'user',         // 승인된 일반 사용자
  ADMIN: 'admin'        // 관리자
};

export const PERMISSION_STATUS = {
  NOT_REQUESTED: 'not_requested',  // 권한 신청 전
  PENDING: 'pending',              // 승인 대기 중
  APPROVED: 'approved',            // 승인됨
  REJECTED: 'rejected'             // 거부됨
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 사용자 권한 관련 상태 추가
    const [userRole, setUserRole] = useState(USER_ROLES.GUEST);
    const [permissionStatus, setPermissionStatus] = useState(PERMISSION_STATUS.NOT_REQUESTED);

    // 토큰 유효성 검사 함수
    const checkTokenValidity = async () => {
        try {
            const authData = await userService.getCurrentAuth();
            
            if (authData.isAuthenticated && authData.currentUser) {
                setUser(authData.currentUser);
                setIsAuthenticated(true);
                
                // 사용자 권한 설정 - is_admin, is_superuser 필드도 확인
                if (authData.currentUser.role === 'admin' || authData.currentUser.is_admin || authData.currentUser.is_superuser) {
                    setUserRole(USER_ROLES.ADMIN);
                    setPermissionStatus(PERMISSION_STATUS.APPROVED);
                    console.log('관리자 권한 설정됨:', USER_ROLES.ADMIN);
                } else if (authData.currentUser.role === 'user') {
                    setUserRole(USER_ROLES.USER);
                    setPermissionStatus(PERMISSION_STATUS.APPROVED);
                    console.log('일반 사용자 권한 설정됨:', USER_ROLES.USER);
                } else {
                    // 권한 상태 설정 (백엔드에서 받아와야 함)
                    const permStatus = authData.currentUser.permissionStatus || PERMISSION_STATUS.NOT_REQUESTED;
                    setPermissionStatus(permStatus);
                    
                    if (permStatus === PERMISSION_STATUS.APPROVED) {
                        setUserRole(USER_ROLES.USER);
                        console.log('승인된 사용자 권한 설정됨:', USER_ROLES.USER);
                    } else {
                        setUserRole(USER_ROLES.PENDING);
                        console.log('대기 중인 사용자 권한 설정됨:', USER_ROLES.PENDING);
                    }
                }
                return true;
            } else {
                // 토큰이 유효하지 않은 경우
                setUser(null);
                setIsAuthenticated(false);
                setUserRole(USER_ROLES.GUEST);
                setPermissionStatus(PERMISSION_STATUS.NOT_REQUESTED);
                return false;
            }
        } catch (error) {
            console.error('토큰 유효성 검사 중 오류:', error);
            setUser(null);
            setIsAuthenticated(false);
            setUserRole(USER_ROLES.GUEST);
            setPermissionStatus(PERMISSION_STATUS.NOT_REQUESTED);
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
            setLoading(true);
            const userData = await userService.login(email, password);
            
            setIsAuthenticated(true);
            setUser(userData);
            
            // 사용자 권한 설정
            if (userData.role === 'admin' || userData.is_admin || userData.is_superuser) {
                setUserRole(USER_ROLES.ADMIN);
                setPermissionStatus(PERMISSION_STATUS.APPROVED);
                console.log('관리자 권한 설정됨:', USER_ROLES.ADMIN);
            } else if (userData.role === 'user') {
                setUserRole(USER_ROLES.USER);
                setPermissionStatus(PERMISSION_STATUS.APPROVED);
                console.log('일반 사용자 권한 설정됨:', USER_ROLES.USER);
            } else {
                // 권한 상태 설정 (백엔드에서 받아와야 함)
                const permStatus = userData.permissionStatus || PERMISSION_STATUS.NOT_REQUESTED;
                setPermissionStatus(permStatus);
                
                if (permStatus === PERMISSION_STATUS.APPROVED) {
                    setUserRole(USER_ROLES.USER);
                    console.log('승인된 사용자 권한 설정됨:', USER_ROLES.USER);
                } else {
                    setUserRole(USER_ROLES.PENDING);
                    console.log('대기 중인 사용자 권한 설정됨:', USER_ROLES.PENDING);
                }
            }
            
            return userData;
        } catch (error) {
            console.error('로그인 중 오류:', error);
            setError(error.message || '로그인 중 오류가 발생했습니다.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            const newUser = await userService.register(userData);
            
            // 회원가입 후 자동 로그인 (백엔드 구현에 따라 다를 수 있음)
            // 일반적으로는 회원가입 후 로그인 페이지로 리다이렉트하는 것이 좋음
            setIsAuthenticated(true);
            setUser(newUser);
            
            // 신규 사용자는 기본적으로 권한 신청 필요
            setUserRole(USER_ROLES.PENDING);
            setPermissionStatus(PERMISSION_STATUS.NOT_REQUESTED);
            
            return newUser;
        } catch (error) {
            console.error('회원가입 중 오류:', error);
            setError(error.message || '회원가입 중 오류가 발생했습니다.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await userService.logout();
            
            setIsAuthenticated(false);
            setUser(null);
            setUserRole(USER_ROLES.GUEST);
            setPermissionStatus(PERMISSION_STATUS.NOT_REQUESTED);
        } catch (error) {
            console.error('로그아웃 중 오류:', error);
            setError('로그아웃 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (userData) => {
        try {
            setLoading(true);
            
            if (!user || !user.id) {
                throw new Error('사용자 정보가 없습니다.');
            }
            
            const updatedUser = await userService.updateUser(user.id, userData);
            
            // 업데이트된 사용자 정보 설정
            setUser(prevUser => ({
                ...prevUser,
                ...updatedUser
            }));
            
            return updatedUser;
        } catch (error) {
            console.error('사용자 정보 업데이트 중 오류:', error);
            setError(error.message || '사용자 정보 업데이트 중 오류가 발생했습니다.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 권한 상태 업데이트 함수
    const updatePermissionStatus = async (status) => {
        try {
            setPermissionStatus(status);
            
            if (status === PERMISSION_STATUS.APPROVED) {
                setUserRole(USER_ROLES.USER);
            } else {
                setUserRole(USER_ROLES.PENDING);
            }
            
            // 사용자 객체에도 권한 상태 업데이트
            setUser(prevUser => ({
                ...prevUser,
                permissionStatus: status
            }));
            
            return status;
        } catch (error) {
            console.error('권한 상태 업데이트 중 오류:', error);
            setError('권한 상태 업데이트 중 오류가 발생했습니다.');
            throw error;
        }
    };

    // 권한 확인 함수
    const hasPermission = (requiredRole = USER_ROLES.USER) => {
        // 관리자는 모든 권한을 가짐
        if (userRole === USER_ROLES.ADMIN) return true;
        
        // 요구되는 권한에 따라 확인
        switch (requiredRole) {
            case USER_ROLES.ADMIN:
                return userRole === USER_ROLES.ADMIN;
            case USER_ROLES.USER:
                return userRole === USER_ROLES.USER || userRole === USER_ROLES.ADMIN;
            case USER_ROLES.PENDING:
                return userRole === USER_ROLES.PENDING || userRole === USER_ROLES.USER || userRole === USER_ROLES.ADMIN;
            case USER_ROLES.GUEST:
                return true; // 모든 사용자가 접근 가능
            default:
                return false;
        }
    };

    // 컨텍스트 값
    const value = {
        user,
        isAuthenticated,
        loading,
        error,
        userRole,
        permissionStatus,
        login,
        logout,
        register,
        updateUser,
        updatePermissionStatus,
        hasPermission
    };

    return (
        <AuthContext.Provider value={value}>
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