import React, { useState, useEffect } from 'react';
import { useAuth } from '@/pages/auth/components/AuthContext';
import { userService } from '@/utils/apiService';
import { Loader, User, Mail, Edit, Save, X, AlertCircle, Shield, CheckCircle, Clock, XCircle, Crown, Star, Camera, Lock, Key, KeyRound, AlertTriangle } from 'lucide-react';
import ProfileImageModal from './components/ProfileImageModal';
import { Link } from 'react-router-dom';

const Settings = () => {
    const { user, updateUser } = useAuth();
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
            setFormData(prev => ({
                ...prev,
                username: user.username || '',
                email: user.email || '',
                requestName: user.username || '' // 기본값으로 사용자명 설정
            }));
            
            // 프로필 이미지 설정
            setProfileImage(user.profile_image || null);
            
            // 사용자 권한 상태 가져오기 (백엔드 API 호출 필요)
            const fetchUserStatus = async () => {
                try {
                    // 실제 구현 시 API 호출로 대체
                    // const response = await userService.getUserById(user.id);
                    // setUserStatus(response.user_status);
                    
                    // 임시 구현: 사용자 역할에 따라 상태 설정
                    if (user.is_superuser) {
                        setUserStatus('superuser');
                    } else if (user.is_admin) {
                        setUserStatus('admin');
                    } else if (user.status) {
                        setUserStatus(user.status);
                    } else if (user.user_status) {
                        setUserStatus(user.user_status);
                    }
                    
                    console.log('사용자 상태:', userStatus);
                } catch (error) {
                    console.error('사용자 권한 상태 조회 중 오류:', error);
                }
            };
            
            fetchUserStatus();
        }
    }, [user]);

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

            // 권한 신청 API 호출
            await userService.requestApproval({
                name: formData.requestName,
                department: formData.requestDepartment,
                note: formData.requestNote
            });
            
            setSuccess('권한 신청이 성공적으로 전송되었습니다. 관리자 승인을 기다려주세요.');
            setUserStatus('pending'); // 상태 업데이트
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
        setProfileImage(imageUrl);
        setSuccess('프로필 이미지가 성공적으로 업데이트되었습니다.');
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">설정</h1>
            
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
                        </div>
                    )}
                </div>
                
                {/* 프로필 이미지 (오른쪽) */}
                <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-semibold mb-6 text-center">프로필 이미지</h2>
                    <div className="avatar mb-6">
                        <div className="w-40 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img 
                                src={user?.profile_image || `https://placehold.co/200x200/9370DB/FFFFFF?text=${user?.username?.charAt(0) || 'U'}`} 
                                alt={user?.username || '사용자'} 
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
                        <span>권한이 승인되었습니다. 추가 기능을 사용할 수 있습니다.</span>
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
