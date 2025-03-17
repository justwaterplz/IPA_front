import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Crop as CropIcon, Check, Loader, ArrowLeft } from 'lucide-react';
import { userService } from '@/utils/apiService';
import Cropper from 'react-easy-crop';
import { useAuth } from '@/pages/auth/components/AuthContext';

const ProfileImageModal = ({ isOpen, onClose, onImageUpdate, currentImage }) => {
    const { user } = useAuth(); // 현재 로그인한 사용자 정보 가져오기
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadStep, setUploadStep] = useState('select'); // select, preview, crop, uploading
    const fileInputRef = useRef(null);
    const overlayRef = useRef(null);
    
    // 크롭 관련 상태 - 초기 zoom 값을 0.8로 낮춤
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(0.8);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    
    // 크롭 영역 크기 계산 (반응형)
    const [cropSize, setCropSize] = useState({ width: 200, height: 200 });
    const cropperRef = useRef(null);

    // 모달이 닫힐 때 상태 초기화
    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadError(null);
        setUploadStep('select');
        setCrop({ x: 0, y: 0 });
        setZoom(0.8);
        setCroppedAreaPixels(null);
        onClose();
    };

    // 파일 선택 핸들러
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 파일 유형 검증
        if (!file.type.startsWith('image/')) {
            setUploadError('이미지 파일만 업로드할 수 있습니다.');
            return;
        }

        // 파일 크기 검증 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('이미지 크기는 5MB 이하여야 합니다.');
            return;
        }

        setSelectedFile(file);
        setUploadError(null);

        // 이미지 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
            setUploadStep('crop'); // 파일 선택 후 바로 크롭 단계로 이동
        };
        reader.readAsDataURL(file);
    };

    // 크롭 컨테이너 크기 조정 시 크롭 영역 크기 업데이트
    const updateCropSize = useCallback(() => {
        if (cropperRef.current) {
            const container = cropperRef.current.querySelector('.reactEasyCrop_Container');
            if (container) {
                const width = Math.min(container.clientWidth * 0.8, 250);
                setCropSize({ width, height: width });
            }
        }
    }, []);

    // 크롭 완료 핸들러
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // 컴포넌트 마운트/언마운트 시 이벤트 리스너 설정
    useEffect(() => {
        if (uploadStep === 'crop') {
            updateCropSize();
            window.addEventListener('resize', updateCropSize);
        }
        
        return () => {
            window.removeEventListener('resize', updateCropSize);
        };
    }, [uploadStep, updateCropSize]);

    // 크롭된 이미지 생성
    const createCroppedImage = async () => {
        if (!previewUrl || !croppedAreaPixels) return null;

        return new Promise((resolve) => {
            const image = new Image();
            image.src = previewUrl;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 원형 크롭을 위한 설정
                const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height);
                canvas.width = size;
                canvas.height = size;
                
                // 원형 클리핑 패스 생성
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                ctx.clip();
                
                // 이미지 그리기
                ctx.drawImage(
                    image,
                    croppedAreaPixels.x,
                    croppedAreaPixels.y,
                    croppedAreaPixels.width,
                    croppedAreaPixels.height,
                    0,
                    0,
                    size,
                    size
                );
                
                // 크롭된 이미지를 Blob으로 변환
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(null);
                        return;
                    }
                    
                    // Blob에 파일 이름 추가
                    const croppedFile = new File([blob], selectedFile.name, {
                        type: 'image/jpeg',
                        lastModified: new Date().getTime()
                    });
                    
                    // 크롭된 이미지의 URL 생성
                    const croppedUrl = URL.createObjectURL(blob);
                    resolve({ file: croppedFile, url: croppedUrl });
                }, 'image/jpeg', 0.95);
            };
        });
    };

    // 크롭 완료 후 미리보기로 이동
    const handleCropDone = async () => {
        const croppedImage = await createCroppedImage();
        if (croppedImage) {
            setSelectedFile(croppedImage.file);
            setPreviewUrl(croppedImage.url);
            setUploadStep('preview');
        }
    };

    // 이미지 업로드 핸들러
    const handleUpload = async () => {
        if (!selectedFile || !user?.id) return;

        setIsUploading(true);
        setUploadStep('uploading');
        setUploadError(null);

        try {
            // FormData 생성
            const formData = new FormData();
            formData.append('image', selectedFile);

            // API 호출 - 사용자 ID 전달
            const response = await userService.updateProfileImage(formData, user.id);

            // 성공 시 부모 컴포넌트에 알림
            onImageUpdate(response.profile_image || previewUrl);
            handleClose();
        } catch (error) {
            setUploadError(error.message || '이미지 업로드 중 오류가 발생했습니다.');
            setUploadStep('preview');
        } finally {
            setIsUploading(false);
        }
    };

    // 파일 선택 버튼 클릭 핸들러
    const handleSelectClick = () => {
        fileInputRef.current.click();
    };

    // 모달이 닫혀있으면 아무것도 렌더링하지 않음
    if (!isOpen) return null;

    return (
        <>
            {/* 반투명 배경 오버레이 */}
            <div 
                ref={overlayRef}
                className="fixed inset-0 z-[200]" 
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                onClick={handleClose}
            ></div>
            
            <div className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none">
                <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    {/* 모달 헤더 */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">
                            {uploadStep === 'select' && '프로필 이미지 변경'}
                            {uploadStep === 'crop' && '이미지 조정'}
                            {uploadStep === 'preview' && '이미지 미리보기'}
                            {uploadStep === 'uploading' && '이미지 업로드 중'}
                        </h3>
                        <button 
                            className="btn btn-ghost btn-sm btn-circle"
                            onClick={handleClose}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* 모달 본문 */}
                    <div className="p-6">
                        {/* 오류 메시지 */}
                        {uploadError && (
                            <div className="alert alert-error mb-4 text-sm">
                                <span>{uploadError}</span>
                            </div>
                        )}

                        {/* 파일 선택 단계 */}
                        {uploadStep === 'select' && (
                            <div className="flex flex-col items-center">
                                <div className="mb-6">
                                    {currentImage ? (
                                        <div className="avatar">
                                            <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                                                <img 
                                                    src={currentImage} 
                                                    alt="현재 프로필 이미지" 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://via.placeholder.com/150?text=User';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="avatar">
                                            <div className="w-32 h-32 rounded-full bg-base-300 flex items-center justify-center">
                                                <ImageIcon className="h-16 w-16 text-base-content opacity-40" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <button 
                                    className="btn btn-primary w-full"
                                    onClick={handleSelectClick}
                                >
                                    <Upload className="h-5 w-5 mr-2" />
                                    이미지 선택하기
                                </button>

                                <p className="text-xs text-gray-500 mt-4 text-center">
                                    JPG, PNG, GIF 형식의 이미지를 업로드할 수 있습니다. (최대 5MB)
                                </p>
                            </div>
                        )}

                        {/* 이미지 크롭 단계 */}
                        {uploadStep === 'crop' && previewUrl && (
                            <div className="flex flex-col" ref={cropperRef}>
                                <div className="relative w-full h-64 mb-6">
                                    <Cropper
                                        image={previewUrl}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        cropShape="round"
                                        showGrid={true}
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onCropComplete={onCropComplete}
                                        minZoom={0.5}
                                        maxZoom={3}
                                        objectFit="horizontal-cover"
                                        cropSize={cropSize}
                                        classes={{
                                            containerClassName: 'reactEasyCrop_Container'
                                        }}
                                    />
                                </div>
                                
                                <div className="mb-4">
                                    <label className="label">
                                        <span className="label-text">확대/축소</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3"
                                        step="0.1"
                                        value={zoom}
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="range range-primary"
                                    />
                                </div>

                                <div className="flex gap-2 w-full">
                                    <button 
                                        className="btn btn-outline flex-1"
                                        onClick={() => setUploadStep('select')}
                                    >
                                        <ArrowLeft className="h-5 w-5 mr-2" />
                                        뒤로
                                    </button>
                                    <button 
                                        className="btn btn-primary flex-1"
                                        onClick={handleCropDone}
                                    >
                                        <CropIcon className="h-5 w-5 mr-2" />
                                        자르기
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 이미지 미리보기 단계 */}
                        {uploadStep === 'preview' && previewUrl && (
                            <div className="flex flex-col items-center">
                                <div className="mb-6">
                                    <div className="avatar">
                                        <div className="w-40 h-40 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                                            <img 
                                                src={previewUrl} 
                                                alt="이미지 미리보기" 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full">
                                    <button 
                                        className="btn btn-outline flex-1"
                                        onClick={() => setUploadStep('crop')}
                                    >
                                        <CropIcon className="h-5 w-5 mr-2" />
                                        다시 조정
                                    </button>
                                    <button 
                                        className="btn btn-primary flex-1"
                                        onClick={handleUpload}
                                    >
                                        <Check className="h-5 w-5 mr-2" />
                                        적용하기
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 업로드 중 상태 */}
                        {uploadStep === 'uploading' && (
                            <div className="flex flex-col items-center py-8">
                                <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
                                <p className="text-center">이미지를 업로드하는 중입니다...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileImageModal; 