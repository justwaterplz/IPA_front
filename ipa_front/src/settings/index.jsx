import React, { useState, useEffect } from 'react';
import { useAuth } from '@/pages/auth/components/AuthContext';
import { userService } from '@/utils/apiService';
import { Loader, User, Mail, Edit, Save, X, AlertCircle, Shield, CheckCircle, Clock, XCircle, Crown, Star, Camera, Lock, Key, KeyRound, AlertTriangle } from 'lucide-react';
import ProfileImageModal from './components/ProfileImageModal';
import { Link, useNavigate } from 'react-router-dom';

const Settings = () => {
    const { user, updateUser, updatePermissionStatus } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        // 간소화된 권한 신청 필드
        requestName: '',
        requestDepartment: '',
        requestNote: ''
    });
    
    // 사용자 권한 상태 (백엔드에서 받아와야 함)
    // 'superuser', 'admin', 'not_requested', 'pending', 'approved', 'rejected'
    const [userStatus, setUserStatus] = useState('not_requested');

    // 비밀번호 강도 상태
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        message: '',
        color: 'bg-gray-300'
    });

    // 프로필 이미지 모달 상태
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);

    // 사용자 정보 초기화
    useEffect(() => {
        if (user) {
            console.log('사용자 정보:', user);
            
            setFormData(prev => ({
                ...prev,
                username: user.username || '',
                email: user.email || '',
                requestName: user.username || '' // 기본값으로 사용자명 설정
            }));
            
            // 프로필 이미지 설정
            if (user.profile_image) {
                // 캐시 방지를 위해 타임스탬프 추가
                const timestamp = new Date().getTime();
                const imageWithTimestamp = user.profile_image.includes('?') 
                    ? `${user.profile_image}&t=${timestamp}` 
                    : `${user.profile_image}?t=${timestamp}`;
                
                // 로컬 스토리지에 최신 프로필 이미지 URL 저장
                const storageKey = `profile_image_${user.id}`;
                localStorage.setItem(storageKey, imageWithTimestamp);
                
                setProfileImage(imageWithTimestamp);
                console.log('사용자 프로필 이미지 업데이트:', imageWithTimestamp, '키:', storageKey);
            } else {
                // 로컬 스토리지에서 마지막으로 저장된 프로필 이미지 확인
                const storageKey = user?.id ? `profile_image_${user.id}` : null;
                const lastProfileImage = storageKey ? localStorage.getItem(storageKey) : null;
                if (lastProfileImage) {
                    console.log('로컬 스토리지에서 프로필 이미지 복원:', lastProfileImage, '키:', storageKey);
                    setProfileImage(lastProfileImage);
                } else {
                    setProfileImage(null);
                }
            }
            
            // 사용자 권한 상태 즉시 설정 (비동기 함수 없이)
            // 디버깅을 위한 로그
            console.log('사용자 권한 정보:', {
                is_superuser: user.is_superuser,
                is_admin: user.is_admin,
                is_staff: user.is_staff,
                role: user.role,
                status: user.status,
                user_status: user.user_status
            });
            
            // 권한 설정 우선순위 변경
            let newStatus = 'not_requested';
            
            if (user.is_superuser || user.user_status === 'superuser') {
                newStatus = 'superuser';
            } else if (user.is_admin || user.is_staff || user.role === 'admin') {
                newStatus = 'admin';
            } else if (user.status === 'approved') {
                // status가 approved일 때 명시적으로 처리
                newStatus = 'approved';
            } else if (user.user_status === 'approved') {
                // user_status가 approved일 때 명시적으로 처리
                newStatus = 'approved';
            } else if (user.role === 'user') {
                // role이 user인 경우 approved로 처리
                newStatus = 'approved';
            } else if (user.status && user.status !== 'not_requested') {
                // 그 외 status 값 적용
                newStatus = user.status;
            } else if (user.user_status && user.user_status !== 'not_requested') {
                // 그 외 user_status 값 적용
                newStatus = user.user_status;
            }
            
            console.log('설정할 사용자 상태:', newStatus, '원본 데이터:', {
                status: user.status,
                user_status: user.user_status,
                role: user.role,
                is_admin: user.is_admin,
                is_superuser: user.is_superuser
            });
            
            // 로컬 상태 업데이트
            setUserStatus(newStatus);
            
            // AuthContext의 권한 상태와 다른 경우 동기화
            if (newStatus !== user.status && newStatus !== user.user_status) {
                console.log('AuthContext 권한 상태 동기화 필요:', { 현재: user.status, 새상태: newStatus });
                updatePermissionStatus(newStatus);
            }
            
            // 상태가 설정된 후 확인
            setTimeout(() => {
                console.log('설정 후 사용자 상태:', userStatus);
            }, 100);
            
            // 페이지 로드 시 사용자 정보 새로고침
            const fetchUserInfo = async () => {
                try {
                    const refreshedUser = await userService.getUserInfo(user.id);
                    console.log('새로고침된 사용자 정보:', refreshedUser);
                    
                    // 권한 상태 확인
                    let refreshedStatus = 'not_requested';
                    
                    if (refreshedUser.is_superuser || refreshedUser.user_status === 'superuser') {
                        refreshedStatus = 'superuser';
                    } else if (refreshedUser.is_admin || refreshedUser.is_staff || refreshedUser.role === 'admin') {
                        refreshedStatus = 'admin';
                    } else if (refreshedUser.status === 'approved') {
                        refreshedStatus = 'approved';
                    } else if (refreshedUser.user_status === 'approved') {
                        refreshedStatus = 'approved';
                    } else if (refreshedUser.role === 'user') {
                        refreshedStatus = 'approved';
                    } else if (refreshedUser.status && refreshedUser.status !== 'not_requested') {
                        refreshedStatus = refreshedUser.status;
                    } else if (refreshedUser.user_status && refreshedUser.user_status !== 'not_requested') {
                        refreshedStatus = refreshedUser.user_status;
                    }
                    
                    console.log('새로고침 후 상태:', refreshedStatus);
                    
                    // 상태 업데이트
                    setUserStatus(refreshedStatus);
                    
                    // AuthContext 업데이트
                    await updatePermissionStatus(refreshedStatus);
                } catch (error) {
                    console.error('사용자 정보 새로고침 중 오류:', error);
                }
            };
            
            fetchUserInfo();
        }
    }, [user, updatePermissionStatus]);

    // 폼 데이터 변경 핸들러
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // 비밀번호 강도 계산
        if (name === 'newPassword') {
            calculatePasswordStrength(value);
        }
        
        // 에러 메시지 초기화
        setError(null);
        setSuccess(null);
    };

    // 비밀번호 강도 계산 함수
    const calculatePasswordStrength = (password) => {
        // 비밀번호가 없는 경우
        if (!password) {
            setPasswordStrength({
                score: 0,
                message: '',
                color: 'bg-gray-300'
            });
            return;
        }
        
        let score = 0;
        let message = '';
        let color = '';
        
        // 길이 점수 (최대 2점)
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        
        // 복잡성 점수 (각 1점)
        if (/[A-Z]/.test(password)) score += 1; // 대문자
        if (/[a-z]/.test(password)) score += 1; // 소문자
        if (/[0-9]/.test(password)) score += 1; // 숫자
        if (/[^A-Za-z0-9]/.test(password)) score += 1; // 특수문자
        
        // 점수에 따른 메시지와 색상 설정
        switch(true) {
            case (score <= 2):
                message = '매우 약함';
                color = 'bg-red-500';
                break;
            case (score <= 4):
                message = '약함';
                color = 'bg-orange-500';
                break;
            case (score <= 5):
                message = '보통';
                color = 'bg-yellow-500';
                break;
            case (score >= 6):
                message = '강함';
                color = 'bg-green-500';
                break;
            default:
                message = '';
                color = 'bg-gray-300';
        }
        
        setPasswordStrength({ score, message, color });
    };

    // 정보 수정 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 비밀번호 변경이 있는 경우 검증
            if (formData.newPassword) {
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error('새 비밀번호가 일치하지 않습니다.');
                }
                if (!formData.currentPassword) {
                    throw new Error('현재 비밀번호를 입력해주세요.');
                }
                
                // 비밀번호 강도 검증
                if (passwordStrength.score < 4) {
                    throw new Error('비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.');
                }
            }

            // 업데이트할 데이터 준비
            const updateData = {
                username: formData.username,
                email: formData.email
            };

            // 비밀번호 변경이 있는 경우 추가
            if (formData.newPassword) {
                updateData.current_password = formData.currentPassword;
                updateData.new_password = formData.newPassword;
            }

            // API 호출
            await updateUser(updateData);
            
            // 성공 메시지 설정
            setSuccess('사용자 정보가 성공적으로 업데이트되었습니다.');
            setIsEditing(false);
            
            // 비밀번호 필드 초기화
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
            
            // 비밀번호 강도 초기화
            setPasswordStrength({
                score: 0,
                message: '',
                color: 'bg-gray-300'
            });
        } catch (error) {
            setError(error.message || '사용자 정보 업데이트 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 권한 신청 제출 핸들러
    const handlePermissionRequest = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 필수 필드 검증
            if (!formData.requestName.trim()) {
                throw new Error('이름을 입력해주세요.');
            }
            
            // 메시지(note) 필드 검증 추가
            if (!formData.requestNote.trim()) {
                throw new Error('신청 사유를 입력해주세요. 이 필드는 필수입니다.');
            }

            // 권한 신청 API 호출
            const response = await userService.requestApproval({
                name: formData.requestName,
                department: formData.requestDepartment,
                note: formData.requestNote
            });
            
            console.log('권한 신청 응답:', response);
            
            // 응답에서 상태 정보 확인
            let newStatus = 'pending';
            if (response && response.status) {
                newStatus = response.status;
                console.log('서버에서 받은 새 상태:', response.status);
            } else {
                console.log('서버 응답에 상태 정보가 없어 pending으로 설정');
            }
            
            // 로컬 상태 업데이트
            setUserStatus(newStatus);
            
            // AuthContext의 권한 상태도 업데이트
            await updatePermissionStatus(newStatus);
            
            setSuccess('권한 신청이 성공적으로 전송되었습니다. 관리자 승인을 기다려주세요.');
        } catch (error) {
            setError(error.message || '권한 신청 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 사용자 상태에 따른 아이콘, 메시지, 색상 정보
    const getStatusInfo = () => {
        switch (userStatus) {
            case 'superuser':
                return {
                    icon: <Crown className="h-6 w-6 text-purple-600" />,
                    message: '슈퍼유저 - 모든 권한을 가지고 있습니다.',
                    color: 'text-purple-700',
                    bgColor: 'bg-purple-50',
                    borderColor: 'border-purple-300',
                    alertClass: 'alert-info',
                    gradientFrom: 'from-purple-500',
                    gradientTo: 'to-indigo-500'
                };
            case 'admin':
                return {
                    icon: <Star className="h-6 w-6 text-amber-500" />,
                    message: '관리자 - 사용자 관리 권한을 가지고 있습니다.',
                    color: 'text-amber-700',
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-300',
                    alertClass: 'alert-info',
                    gradientFrom: 'from-amber-400',
                    gradientTo: 'to-orange-300'
                };
            case 'approved':
                return {
                    icon: <CheckCircle className="h-6 w-6 text-emerald-500" />,
                    message: '승인됨 - 모든 기능을 사용할 수 있습니다.',
                    color: 'text-emerald-700',
                    bgColor: 'bg-emerald-50',
                    borderColor: 'border-emerald-300',
                    alertClass: 'alert-success',
                    gradientFrom: 'from-emerald-400',
                    gradientTo: 'to-teal-300'
                };
            case 'pending':
                return {
                    icon: <Clock className="h-6 w-6 text-amber-500" />,
                    message: '승인 대기 중 - 관리자 검토를 기다리고 있습니다.',
                    color: 'text-amber-700',
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-300',
                    alertClass: 'alert-warning',
                    gradientFrom: 'from-amber-300',
                    gradientTo: 'to-yellow-200'
                };
            case 'rejected':
                return {
                    icon: <XCircle className="h-6 w-6 text-rose-500" />,
                    message: '거부됨 - 자세한 내용은 관리자에게 문의하세요.',
                    color: 'text-rose-700',
                    bgColor: 'bg-rose-50',
                    borderColor: 'border-rose-300',
                    alertClass: 'alert-error',
                    gradientFrom: 'from-rose-400',
                    gradientTo: 'to-red-300'
                };
            case 'not_requested':
            default:
                return {
                    icon: <Shield className="h-6 w-6 text-sky-500" />,
                    message: '권한 신청이 필요합니다.',
                    color: 'text-sky-700',
                    bgColor: 'bg-sky-50',
                    borderColor: 'border-sky-300',
                    alertClass: 'alert-info',
                    gradientFrom: 'from-sky-400',
                    gradientTo: 'to-blue-300'
                };
        }
    };

    const statusInfo = getStatusInfo();

    // 권한 신청이 필요한지 확인
    const needsPermissionRequest = ['not_requested', 'rejected'].includes(userStatus);
    
    // 일반 사용자인지 확인 (관리자 요청 섹션 표시 여부)
    const isRegularUser = ['approved'].includes(userStatus);

    // 관리자인지 확인
    const isAdmin = ['admin', 'superuser'].includes(userStatus);

    // 프로필 이미지 업데이트 핸들러
    const handleProfileImageUpdate = (imageUrl) => {
        // 서버에서 이미지 URL을 반환하지 않았지만 업로드는 성공한 경우
        if (imageUrl === 'success') {
            console.log('이미지 업로드 성공, 새로고침 없이 성공 메시지만 표시');
            setSuccess('프로필 이미지가 성공적으로 업데이트되었습니다. 변경사항이 다음 로그인 시 또는 페이지 새로고침 후 적용됩니다.');
            return;
        }
        
        // Blob URL인지 확인
        if (imageUrl.startsWith('blob:')) {
            console.warn('Blob URL은 임시적이며 사용할 수 없습니다:', imageUrl);
            setError('이미지 URL 오류: 서버에서 영구 URL을 받지 못했습니다.');
            return;
        }
        
        console.log('프로필 이미지 업데이트 (서버 URL):', imageUrl);
        
        // 캐시 방지를 위해 타임스탬프 추가
        const timestamp = new Date().getTime();
        const imageWithTimestamp = imageUrl.includes('?') 
            ? `${imageUrl}&t=${timestamp}` 
            : `${imageUrl}?t=${timestamp}`;
        
        // 로컬 스토리지에 최신 프로필 이미지 URL 저장
        const storageKey = `profile_image_${user.id}`;
        localStorage.setItem(storageKey, imageWithTimestamp);
        
        setProfileImage(imageWithTimestamp);
        
        // 사용자 객체 업데이트는 제거 - 이미 API에서 처리됨
        
        setSuccess('프로필 이미지가 성공적으로 업데이트되었습니다.');
    };

    // 사용자 정보 새로고침 함수
    const refreshUserInfo = async () => {
        try {
            setIsLoading(true);
            // 사용자 정보 다시 가져오기
            const refreshedUser = await userService.getUserInfo(user.id);
            console.log('새로고침된 사용자 정보:', refreshedUser);
            
            // 권한 상태 확인
            let newStatus = 'not_requested';
            
            if (refreshedUser.is_superuser || refreshedUser.user_status === 'superuser') {
                newStatus = 'superuser';
            } else if (refreshedUser.is_admin || refreshedUser.is_staff || refreshedUser.role === 'admin') {
                newStatus = 'admin';
            } else if (refreshedUser.status === 'approved') {
                newStatus = 'approved';
            } else if (refreshedUser.user_status === 'approved') {
                newStatus = 'approved';
            } else if (refreshedUser.role === 'user') {
                newStatus = 'approved';
            } else if (refreshedUser.status && refreshedUser.status !== 'not_requested') {
                newStatus = refreshedUser.status;
            } else if (refreshedUser.user_status && refreshedUser.user_status !== 'not_requested') {
                newStatus = refreshedUser.user_status;
            }
            
            console.log('새로고침 후 상태:', newStatus);
            
            // 상태 업데이트
            setUserStatus(newStatus);
            
            // AuthContext 업데이트
            await updatePermissionStatus(newStatus);
            
            setSuccess('사용자 정보가 새로고침되었습니다.');
            
            return newStatus;
        } catch (error) {
            console.error('사용자 정보 새로고침 중 오류:', error);
            setError('사용자 정보 새로고침 중 오류가 발생했습니다.');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // 메인 페이지로 이동하는 함수
    const handleNavigateToMain = async () => {
        console.log('메인 페이지로 이동 시도');
        
        try {
            // 사용자 상태 강제 업데이트
            setUserStatus('approved');
            await updatePermissionStatus('approved');
            
            // 메인 페이지로 이동
            navigate('/');
        } catch (error) {
            console.error('메인 페이지 이동 중 오류:', error);
            // 오류가 발생해도 메인 페이지로 이동 시도
            navigate('/');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">설정</h1>
            
            {/* 디버깅 정보 */}
            <div className="mb-4 text-sm text-gray-500">
                현재 사용자 상태: {userStatus}
            </div>
            
            {/* 관리자 패널 링크 */}
            {isAdmin && (
                <div className="alert alert-info mb-6">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <span>관리자 권한이 있습니다.</span>
                    </div>
                    <div>
                        <Link to="/admin" className="btn btn-primary btn-sm">
                            관리자 패널로 이동
                        </Link>
                    </div>
                </div>
            )}
            
            {/* 프로필 섹션 컨테이너 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* 프로필 정보 (왼쪽) */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <User className="mr-2 h-5 w-5 text-primary" />
                        프로필 정보
                    </h2>
                    
                    <form onSubmit={handleSubmit}>
                        {/* 사용자명 */}
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">사용자명</span>
                            </label>
                            <div className="flex -ml-2">
                                <div className="flex items-center pl-2">
                                    <User className="h-5 w-5 mr-2 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="input input-bordered w-full max-w-xs"
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                        
                        {/* 이메일 */}
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">이메일</span>
                            </label>
                            <div className="flex -ml-2">
                                <div className="flex items-center pl-2">
                                    <Mail className="h-5 w-5 mr-2 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input input-bordered w-full max-w-xs"
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                        
                        {/* 비밀번호 변경 섹션 - 항상 표시하지만 편집 모드에서만 활성화 */}
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">비밀번호 변경</h3>
                            <p className="text-sm text-gray-500 mb-4">비밀번호는 편집 모드에서만 변경할 수 있습니다.</p>
                            
                            {/* 현재 비밀번호 */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">현재 비밀번호</span>
                                </label>
                                <div className="flex -ml-2">
                                    <div className="flex items-center pl-2">
                                        <Lock className="h-5 w-5 mr-2 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        className="input input-bordered w-full max-w-xs"
                                        disabled={!isEditing}
                                        placeholder={isEditing ? "" : "편집 모드에서 입력 가능"}
                                    />
                                </div>
                            </div>
                            
                            {/* 새 비밀번호 */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">새 비밀번호</span>
                                </label>
                                <div className="flex -ml-2">
                                    <div className="flex items-center pl-2">
                                        <Key className="h-5 w-5 mr-2 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="input input-bordered w-full max-w-xs"
                                        disabled={!isEditing}
                                        placeholder={isEditing ? "" : "편집 모드에서 입력 가능"}
                                    />
                                </div>
                                
                                {/* 비밀번호 강도 표시기 */}
                                {isEditing && formData.newPassword && (
                                    <div className="mt-2 w-1/3 ml-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs">비밀번호 강도: {passwordStrength.message}</span>
                                            {/* <span className="text-xs">{passwordStrength.score}/6</span> */}
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div 
                                                className={`h-2.5 rounded-full ${passwordStrength.color}`} 
                                                style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            <span>안전한 비밀번호를 위해 대문자, 소문자, 숫자, 특수문자를 포함해주세요.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* 비밀번호 확인 */}
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">비밀번호 확인</span>
                                </label>
                                <div className="flex -ml-2">
                                    <div className="flex items-center pl-2">
                                        <KeyRound className="h-5 w-5 mr-2 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="input input-bordered w-full max-w-xs"
                                        disabled={!isEditing}
                                        placeholder={isEditing ? "" : "편집 모드에서 입력 가능"}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* 버튼 그룹 */}
                        <div className="flex justify-end gap-2 mt-6">
                            {isEditing ? (
                                <>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        취소
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="loading loading-spinner"></span>
                                                저장 중...
                                            </>
                                        ) : (
                                            <>저장</>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit className="h-4 w-4 mr-1" />
                                    편집
                                </button>
                            )}
                        </div>
                    </form>
                    
                    {/* 알림 메시지 */}
                    {error && (
                        <div className="alert alert-error mt-4">
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {success && (
                        <div className="alert alert-success mt-4">
                            <CheckCircle className="h-5 w-5" />
                            <span>{success}</span>
                            {success.includes('변경사항이 다음 로그인 시') && (
                                <button 
                                    className="btn btn-sm btn-outline btn-success ml-2"
                                    onClick={() => window.location.reload()}
                                >
                                    지금 새로고침
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                {/* 프로필 이미지 (오른쪽) */}
                <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-semibold mb-6 text-center">프로필 이미지</h2>
                    <div className="avatar mb-6">
                        <div className="w-40 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img 
                                src={profileImage || user?.profile_image || `https://placehold.co/200x200/9370DB/FFFFFF?text=${user?.username?.charAt(0) || 'U'}`} 
                                alt={user?.username || '사용자'} 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://placehold.co/200x200/9370DB/FFFFFF?text=${user?.username?.charAt(0) || 'U'}`;
                                }}
                            />
                        </div>
                    </div>
                    <button 
                        className="btn btn-primary w-full mt-10"
                        onClick={() => setIsImageModalOpen(true)}
                    >
                        <Camera className="h-5 w-5 mr-2" />
                        이미지 변경
                    </button>
                    <p className="text-sm text-gray-500 mt-4 text-center">
                        권장 크기: 200x200 픽셀<br />
                        최대 파일 크기: 2MB
                    </p>
                </div>
            </div>
            
            {/* 권한 신청 섹션 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    권한 신청
                </h2>
                
                {userStatus === 'not_requested' && (
                    <div>
                        <p className="mb-4">
                            추가 기능을 사용하기 위해 권한을 신청하세요. 관리자 승인 후 사용 가능합니다.
                        </p>
                        
                        <form onSubmit={handlePermissionRequest} className="space-y-4 max-w-2xl">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">이름</span>
                                </label>
                                <div className="flex -ml-2">
                                    <div className="flex items-center pl-2">
                                        <User className="h-5 w-5 mr-2 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="requestName"
                                        value={formData.requestName}
                                        onChange={handleChange}
                                        className="input input-bordered w-full"
                                        placeholder="실명을 입력하세요"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">소속 부서/팀</span>
                                </label>
                                <div className="flex -ml-2">
                                    <div className="flex items-center pl-2">
                                        <Shield className="h-5 w-5 mr-2 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="requestDepartment"
                                        value={formData.requestDepartment}
                                        onChange={handleChange}
                                        className="input input-bordered w-full"
                                        placeholder="소속 부서나 팀을 입력하세요"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">신청 사유</span>
                                </label>
                                <div className="flex -ml-2">
                                    <div className="flex items-center pl-2 self-start pt-3">
                                        <AlertCircle className="h-5 w-5 mr-2 text-gray-400" />
                                    </div>
                                    <textarea
                                        name="requestNote"
                                        value={formData.requestNote}
                                        onChange={handleChange}
                                        className="textarea textarea-bordered w-full"
                                        placeholder="권한이 필요한 이유를 간략히 설명해주세요"
                                        rows={3}
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading loading-spinner"></span>
                                            신청 중...
                                        </>
                                    ) : (
                                        <>권한 신청</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                {userStatus === 'pending' && (
                    <div className="alert alert-warning">
                        <AlertTriangle className="h-5 w-5" />
                        <span>권한 신청이 검토 중입니다. 관리자의 승인을 기다려주세요.</span>
                    </div>
                )}
                
                {userStatus === 'approved' && (
                    <div className="alert alert-success">
                        <CheckCircle className="h-5 w-5" />
                        <div className="flex flex-col">
                            <span>권한이 승인되었습니다. 추가 기능을 사용할 수 있습니다.</span>
                            <div className="mt-2 flex gap-2">
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleNavigateToMain}
                                >
                                    메인 페이지로 이동
                                </button>
                                <button 
                                    className="btn btn-outline"
                                    onClick={refreshUserInfo}
                                >
                                    상태 새로고침
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {userStatus === 'rejected' && (
                    <div className="alert alert-error">
                        <XCircle className="h-5 w-5" />
                        <span>권한 신청이 거부되었습니다. 자세한 내용은 관리자에게 문의하세요.</span>
                    </div>
                )}
            </div>
            
            {/* 프로필 이미지 변경 모달 */}
            <ProfileImageModal 
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onImageUpdate={handleProfileImageUpdate}
                currentImage={profileImage || user?.profile_image}
            />
        </div>
    );
};

export default Settings;