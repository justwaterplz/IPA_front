import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon, Plus, Tag } from 'lucide-react';
import Header from '@/components/layout/header';
import { postService, fileService } from '@/utils/apiService';
import { useAuth } from '@/pages/auth/components/AuthContext';
import { useModels } from '@/contexts/ModelContext';

// AI 모델 목록 (이제 API에서 가져옵니다)
// const AI_MODELS = [ ... ];

const UploadPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { models, loading: loadingModels } = useModels();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedVersion, setSelectedVersion] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [userPostCount, setUserPostCount] = useState(0);
    const [errors, setErrors] = useState({
        image: '',
        prompt: '',
        model: '',
        version: ''
    });
    
    // 최대 게시물 수 제한
    const MAX_POSTS_PER_USER = 10;

    // 테마 변경용
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    // 사용자 게시물 수 확인
    useEffect(() => {
        const fetchUserPostCount = async () => {
            if (user) {
                try {
                    const response = await postService.getAllPosts();
                    // 페이지네이션 형식의 응답에서 results 배열 추출
                    const allPosts = response.results || [];
                    const userPosts = allPosts.filter(post => post.userId === user.id);
                    setUserPostCount(userPosts.length);
                } catch (error) {
                    console.error('사용자 게시물 수를 가져오는 중 오류 발생:', error);
                    setUserPostCount(0);
                }
            }
        };
        
        fetchUserPostCount();
    }, [user]);

    // 선택된 모델에 따른 버전 목록
    const availableVersions = selectedModel 
        ? models.find(model => model.name === selectedModel)?.versions || []
        : [];

    // 로그인 상태 확인
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/upload' } });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // 모델 선택 핸들러
    const handleModelChange = (e) => {
        const modelName = e.target.value;
        setSelectedModel(modelName);
        setSelectedVersion(''); // 모델이 변경되면 버전 초기화
    };

    // 파일 선택 핸들러
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 이미지 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, image: '이미지 파일만 업로드할 수 있습니다.' }));
            return;
        }

        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, image: '파일 크기는 10MB 이하여야 합니다.' }));
            return;
        }

        setErrors(prev => ({ ...prev, image: '' }));
        setSelectedFile(file);

        // 이미지 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // 파일 드래그 앤 드롭 핸들러
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;

        // 이미지 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, image: '이미지 파일만 업로드할 수 있습니다.' }));
            return;
        }

        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, image: '파일 크기는 10MB 이하여야 합니다.' }));
            return;
        }

        setErrors(prev => ({ ...prev, image: '' }));
        setSelectedFile(file);

        // 이미지 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // 드래그 오버 핸들러
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // 선택한 파일 제거
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        setErrors(prev => ({ ...prev, image: '이미지는 필수 입력 항목입니다.' }));
    };

    // 태그 추가 핸들러
    const handleAddTag = () => {
        const trimmedTag = tagInput.trim();
        if (!trimmedTag) return;
        
        // 중복 태그 방지
        if (tags.includes(trimmedTag)) {
            setTagInput('');
            return;
        }
        
        setTags([...tags, trimmedTag]);
        setTagInput('');
    };

    // 태그 삭제 핸들러
    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // 태그 입력 시 엔터키 처리
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 폼 제출 방지
            handleAddTag();
        }
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedFile) {
            setError('이미지를 선택해주세요.');
            return;
        }
        
        if (!prompt.trim()) {
            setError('프롬프트를 입력해주세요.');
            return;
        }
        
        setIsUploading(true);
        setError('');

        try {
            console.log('파일 업로드 및 게시물 생성 시작:', selectedFile);
            console.log('파일 정보:', {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                lastModified: new Date(selectedFile.lastModified).toISOString()
            });
            
            // FormData 직접 생성
            const formData = new FormData();
            
            // 백엔드 모델에 맞게 'image' 필드에 파일 직접 추가
            if (selectedFile.type.startsWith('image/')) {
                // 파일 이름에서 특수문자 제거 (파일명 문제로 인한 오류 방지)
                const originalFileName = selectedFile.name;
                const safeFileName = originalFileName.replace(/[^\w\s.-]/g, '');
                
                // 파일명에 특수문자가 있으면 새 파일 객체 생성
                let fileToUpload = selectedFile;
                if (safeFileName !== originalFileName) {
                    console.log('파일명에 특수문자가 있어 안전한 파일명으로 변경합니다.');
                    console.log('원본 파일명:', originalFileName);
                    console.log('안전한 파일명:', safeFileName);
                    
                    // 새 파일 객체 생성 (파일명만 변경)
                    fileToUpload = new File(
                        [selectedFile], 
                        safeFileName, 
                        { type: selectedFile.type }
                    );
                }
                
                // 파일 객체 전송 - Content-Type을 설정하지 않고 FormData가 자동으로 처리하도록 함
                formData.append('image', fileToUpload);
                console.log('이미지 파일 추가:', fileToUpload.name, fileToUpload.type, fileToUpload.size);
                
                // FormData에 파일이 제대로 추가되었는지 확인
                const imageEntry = formData.get('image');
                if (imageEntry instanceof File) {
                    console.log('FormData에 파일이 정상적으로 추가됨:', 
                        imageEntry.name, 
                        imageEntry.type, 
                        imageEntry.size
                    );
                } else {
                    console.error('FormData에 파일이 아닌 데이터가 추가됨:', imageEntry);
                }
            } else {
                formData.append('file', selectedFile);
                console.log('일반 파일 추가:', selectedFile.name);
            }
            
            // 게시물 정보 추가 - 문자열 형태로 추가
            formData.append('title', prompt.substring(0, 100)); // 프롬프트의 첫 100자를 제목으로 사용
            formData.append('content', prompt);
            
            // AI 모델 정보 추가 - 백엔드 요구사항에 맞게 필드명 수정
            if (selectedModel) {
                formData.append('used_model', selectedModel);
                console.log('AI 모델 추가:', selectedModel);
            }
            
            if (selectedVersion) {
                formData.append('model_version', selectedVersion);
                console.log('모델 버전 추가:', selectedVersion);
            }
            
            // 태그 추가 - 백엔드 API 형식에 맞게 수정
            if (tags && tags.length > 0) {
                // 백엔드는 아이템 리스트(배열)를 기대함
                // 각 태그를 개별 항목으로 전송
                tags.forEach(tag => {
                    formData.append('tag_names', tag);
                });
                
                console.log('태그 추가 (개별 항목):', tags);
            }
            
            console.log('게시물 생성 요청 데이터:', {
                title: prompt.substring(0, 100),
                content: prompt,
                used_model: selectedModel,
                model_version: selectedVersion,
                tags: tags,
                image: selectedFile ? selectedFile.name : null
            });
            
            // FormData 내용 로깅
            console.log('FormData 내용:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`- ${key}: File: ${value.name} (${value.type}, ${value.size} bytes)`);
                } else {
                    console.log(`- ${key}: ${value}`);
                }
            }
            
            // multipart/form-data 형식으로 요청 전송
            console.log('multipart/form-data 형식으로 요청을 전송합니다.');
            console.log('Content-Type 헤더는 axios가 자동으로 설정하도록 합니다.');
            
            // 파일 업로드와 게시물 생성을 한 번에 처리
            const response = await postService.createPost(formData);
            
            console.log('게시물 생성 완료:', response);
            
            // 응답에 id가 있는지 확인
            if (response && response.id) {
                console.log('생성된 게시물 ID:', response.id);
                // 성공 시 상세 페이지로 이동
                navigate(`/posts/${response.id}/`);
            } else {
                console.warn('게시물이 생성되었지만 ID가 없습니다. 메인 페이지로 이동합니다.');
                // ID가 없으면 메인 페이지로 이동
                navigate('/');
            }
        } catch (err) {
            console.error('업로드 오류:', err);
            setError(err.message || '이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsUploading(false);
        }
    };

    // 이미지 크기 줄이기 함수 추가
    const resizeImage = (base64Str, maxWidth = 400, maxHeight = 400) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                // 이미지가 최대 크기보다 크면 비율 유지하며 축소
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // 이미지 품질 조정 (0.5 = 50% 품질)
                const resizedBase64 = canvas.toDataURL('image/jpeg', 0.5);
                resolve(resizedBase64);
            };
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">

            <Header theme={theme} setTheme={setTheme} />

            <h1 className="text-3xl font-bold mb-8 text-center mt-6">이미지 업로드</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 이미지 업로드 영역 */}
                <div>
                    <label className="block text-lg font-medium mb-2">
                        이미지 <span className="text-red-500">*</span>
                    </label>
                    <div 
                        className={`border-2 border-dashed rounded-lg p-8 text-center ${
                            errors.image ? 'border-red-500' : previewUrl ? 'border-primary' : 'border-gray-300'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        {previewUrl ? (
                            <div className="relative">
                                <img 
                                    src={previewUrl} 
                                    alt="미리보기" 
                                    className="max-h-96 mx-auto rounded-lg"
                                />
                                <button 
                                    type="button"
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                                    onClick={handleRemoveFile}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="py-12">
                                <ImageIcon size={64} className="mx-auto mb-4 text-gray-400" />
                                <p className="text-lg mb-4">이미지를 드래그하거나 클릭하여 업로드하세요</p>
                                <p className="text-sm text-gray-500 mb-4">지원 형식: JPG, PNG, GIF (최대 10MB)</p>
                                <label className="btn btn-primary">
                                    파일 선택
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                    {errors.image && (
                        <p className="text-red-500 mt-1">{errors.image}</p>
                    )}
                </div>

                {/* AI 모델 선택 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-lg font-medium mb-2">
                            AI 모델 <span className="text-red-500">*</span>
                        </label>
                        <select 
                            className={`select select-bordered w-full ${errors.model ? 'select-error' : ''}`}
                            value={selectedModel}
                            onChange={handleModelChange}
                            disabled={loadingModels}
                        >
                            <option value="">AI 모델 선택</option>
                            {loadingModels ? (
                                <option value="" disabled>모델 목록 로딩 중...</option>
                            ) : models.length === 0 ? (
                                <option value="" disabled>사용 가능한 모델이 없습니다</option>
                            ) : (
                                models.map(model => (
                                    <option key={model.id} value={model.name}>
                                        {model.name}
                                    </option>
                                ))
                            )}
                        </select>
                        {errors.model && (
                            <p className="text-red-500 mt-1">{errors.model}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-lg font-medium mb-2">
                            모델 버전 <span className="text-red-500">*</span>
                        </label>
                        <select 
                            className={`select select-bordered w-full ${errors.version ? 'select-error' : ''}`}
                            value={selectedVersion}
                            onChange={(e) => setSelectedVersion(e.target.value)}
                            disabled={!selectedModel}
                        >
                            <option value="">버전 선택</option>
                            {availableVersions.map(version => (
                                <option key={version} value={version}>
                                    {version}
                                </option>
                            ))}
                        </select>
                        {errors.version && (
                            <p className="text-red-500 mt-1">{errors.version}</p>
                        )}
                    </div>
                </div>

                {/* 프롬프트 입력 영역 */}
                <div>
                    <label className="block text-lg font-medium mb-2">
                        프롬프트 <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                        className={`textarea textarea-bordered w-full h-32 ${errors.prompt ? 'textarea-error' : ''}`}
                        placeholder="이 이미지를 생성하는 데 사용한 프롬프트를 입력하세요..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    ></textarea>
                    {errors.prompt && (
                        <p className="text-red-500 mt-1">{errors.prompt}</p>
                    )}
                </div>

                {/* 태그 입력 영역 */}
                <div>
                    <label className="block text-lg font-medium mb-2">
                        태그 (선택사항)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag, index) => (
                            <div key={index} className="badge badge-primary gap-1 p-3">
                                <span>{tag}</span>
                                <button 
                                    type="button" 
                                    className="btn btn-xs btn-circle btn-ghost"
                                    onClick={() => handleRemoveTag(tag)}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="join w-full">
                        <div className="join-item flex-1">
                            <input 
                                type="text" 
                                className="input input-bordered w-full"
                                placeholder="태그 입력 후 엔터 (예: 풍경, landscape, 자연, nature)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                            />
                        </div>
                        <button 
                            type="button" 
                            className="btn join-item ml-4"
                            onClick={handleAddTag}
                        >
                            <Plus size={20} />
                            추가
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        <Tag size={14} className="inline mr-1" />
                        한글, 영어 태그를 입력할 수 있습니다. 태그는 검색에 활용됩니다.
                    </p>
                </div>

                {/* 오류 메시지 */}
                {error && (
                    <div className="alert alert-error">
                        <span>{error}</span>
                    </div>
                )}

                {/* 제출 버튼 */}
                <div className="flex justify-end">
                    <button 
                        type="button" 
                        className="btn btn-ghost mr-2"
                        onClick={() => navigate(-1)}
                    >
                        취소
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <span className="loading loading-spinner"></span>
                                업로드 중...
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                업로드
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UploadPage; 