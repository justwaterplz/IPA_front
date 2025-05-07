import React, { useState, useEffect } from 'react';
import { 
    Settings, 
    PlusCircle, 
    Edit, 
    Trash2, 
    RefreshCw, 
    Loader,
    CheckCircle,
    XCircle,
    PenTool,
    Tag
} from 'lucide-react';
import { useModels } from '@/contexts/ModelContext'; // ModelContext 사용

const AdminModelManager = () => {
    // ModelContext에서 상태와 메서드 가져오기
    const { 
        models, 
        loading, 
        error: contextError, 
        fetchModels,
        addModel: contextAddModel,
        updateModel: contextUpdateModel,
        deleteModel: contextDeleteModel,
        addModelVersion: contextAddModelVersion,
        deleteModelVersion: contextDeleteModelVersion
    } = useModels();

    const [selectedModel, setSelectedModel] = useState(null);
    
    // 모델 편집 상태
    const [editingModel, setEditingModel] = useState(null);
    const [newModelName, setNewModelName] = useState('');
    
    // 버전 편집 상태
    const [newVersion, setNewVersion] = useState('');
    const [processingModel, setProcessingModel] = useState(null);
    const [error, setError] = useState(null);

    // 첫 번째 모델 선택 (models가 변경될 때)
    useEffect(() => {
        if (models.length > 0 && !selectedModel) {
            setSelectedModel(models[0]);
        }
    }, [models, selectedModel]);

    // 컨텍스트 에러를 로컬 에러 상태에 반영
    useEffect(() => {
        if (contextError) {
            setError(contextError);
        }
    }, [contextError]);
    
    // 모델 선택 핸들러
    const handleSelectModel = (model) => {
        setSelectedModel(model);
        // 편집 모드 초기화
        setEditingModel(null);
        setNewModelName('');
        setNewVersion('');
    };
    
    // 새 모델 추가 핸들러
    const handleAddModel = async () => {
        if (!newModelName.trim()) {
            alert('모델 이름을 입력해주세요.');
            return;
        }
        
        try {
            setProcessingModel('new');
            
            await contextAddModel({
                name: newModelName,
                versions: []
            });
            
            // 새로 추가한 모델 선택
            const addedModel = models.find(model => model.name === newModelName);
            if (addedModel) {
                setSelectedModel(addedModel);
            }
            
            // 입력 필드 초기화
            setNewModelName('');
            setEditingModel(null);
            
        } catch (err) {
            alert('모델 추가 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setProcessingModel(null);
        }
    };
    
    // 모델 이름 수정 핸들러
    const handleUpdateModel = async () => {
        if (!selectedModel || !newModelName.trim()) {
            alert('모델 이름을 입력해주세요.');
            return;
        }
        
        try {
            setProcessingModel(selectedModel.id);
            
            await contextUpdateModel(selectedModel.id, {
                ...selectedModel,
                name: newModelName
            });
            
            // 수정한 모델 다시 선택
            const updatedModel = models.find(model => model.id === selectedModel.id);
            if (updatedModel) {
                setSelectedModel(updatedModel);
            }
            
            // 입력 필드 초기화
            setNewModelName('');
            setEditingModel(null);
            
        } catch (err) {
            alert('모델 수정 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setProcessingModel(null);
        }
    };
    
    // 모델 삭제 핸들러
    const handleDeleteModel = async (modelId) => {
        if (!confirm('정말로 이 모델을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }
        
        try {
            setProcessingModel(modelId);
            
            await contextDeleteModel(modelId);
            
            // 현재 선택된 모델이 삭제된 경우 선택 초기화
            if (selectedModel && selectedModel.id === modelId) {
                setSelectedModel(models.length > 0 ? models[0] : null);
            }
            
        } catch (err) {
            alert('모델 삭제 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setProcessingModel(null);
        }
    };
    
    // 버전 추가 핸들러
    const handleAddVersion = async () => {
        if (!selectedModel || !newVersion.trim()) {
            alert('버전을 입력해주세요.');
            return;
        }
        
        // 이미 존재하는 버전인지 확인
        if (selectedModel.versions.includes(newVersion)) {
            alert('이미 존재하는 버전입니다.');
            return;
        }
        
        try {
            setProcessingModel(selectedModel.id);
            
            await contextAddModelVersion(selectedModel.id, {
                version: newVersion
            });
            
            // 수정한 모델 다시 선택
            const updatedModel = models.find(model => model.id === selectedModel.id);
            if (updatedModel) {
                setSelectedModel(updatedModel);
            }
            
            // 입력 필드 초기화
            setNewVersion('');
            
        } catch (err) {
            alert('버전 추가 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setProcessingModel(null);
        }
    };
    
    // 버전 삭제 핸들러
    const handleDeleteVersion = async (version) => {
        if (!selectedModel) return;
        
        if (!confirm(`정말로 ${version} 버전을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }
        
        try {
            setProcessingModel(selectedModel.id);
            
            await contextDeleteModelVersion(selectedModel.id, version);
            
            // 수정한 모델 다시 선택
            const updatedModel = models.find(model => model.id === selectedModel.id);
            if (updatedModel) {
                setSelectedModel(updatedModel);
            }
            
        } catch (err) {
            alert('버전 삭제 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setProcessingModel(null);
        }
    };
    
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <PenTool className="h-6 w-6 text-primary" />
                <span>AI 모델 관리</span>
                <button 
                    className="btn btn-sm btn-outline ml-auto"
                    onClick={fetchModels}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </button>
            </h2>
            
            {error && (
                <div className="alert alert-error mb-4">
                    <XCircle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 모델 목록 */}
                <div className="md:col-span-1">
                    <div className="bg-base-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">모델 목록</h3>
                            <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                    setEditingModel('new');
                                    setNewModelName('');
                                }}
                            >
                                <PlusCircle className="h-4 w-4 mr-1" />
                                새 모델
                            </button>
                        </div>
                        
                        {/* 새 모델 추가 폼 */}
                        {editingModel === 'new' && (
                            <div className="card bg-base-100 shadow-md p-4 mb-4">
                                <h4 className="font-medium mb-2">새 모델 추가</h4>
                                <div className="form-control">
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        placeholder="모델 이름 입력..."
                                        value={newModelName}
                                        onChange={(e) => setNewModelName(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button 
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => {
                                            setEditingModel(null);
                                            setNewModelName('');
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={handleAddModel}
                                        disabled={processingModel === 'new'}
                                    >
                                        {processingModel === 'new' ? (
                                            <>
                                                <Loader className="h-4 w-4 animate-spin mr-1" />
                                                처리 중...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                추가
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* 모델 목록 */}
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader className="h-8 w-8 animate-spin mx-auto text-primary" />
                                <p className="mt-2 text-gray-500">모델 목록을 불러오는 중...</p>
                            </div>
                        ) : models.length === 0 ? (
                            <div className="text-center py-8">
                                <Settings className="h-8 w-8 mx-auto text-gray-400" />
                                <p className="mt-2 text-gray-500">등록된 모델이 없습니다.</p>
                            </div>
                        ) : (
                            <ul className="menu bg-base-100 rounded-box">
                                {models.map((model) => (
                                    <li key={model.id}>
                                        <a 
                                            className={selectedModel?.id === model.id ? 'active' : ''}
                                            onClick={() => handleSelectModel(model)}
                                        >
                                            <div className="flex w-full justify-between items-center">
                                                <span>{model.name}</span>
                                                <div className="flex gap-1">
                                                    <button 
                                                        className="btn btn-xs btn-ghost btn-square"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingModel(model.id);
                                                            setNewModelName(model.name);
                                                            setSelectedModel(model);
                                                        }}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </button>
                                                    <button 
                                                        className="btn btn-xs btn-ghost btn-square text-error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteModel(model.id);
                                                        }}
                                                        disabled={processingModel === model.id}
                                                    >
                                                        {processingModel === model.id ? (
                                                            <Loader className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3 w-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                
                {/* 모델 상세 정보 */}
                <div className="md:col-span-2">
                    {selectedModel ? (
                        <div className="bg-base-200 rounded-lg p-4">
                            {/* 모델 이름 및 편집 */}
                            {editingModel === selectedModel.id ? (
                                <div className="card bg-base-100 shadow-md p-4 mb-4">
                                    <h4 className="font-medium mb-2">모델 이름 수정</h4>
                                    <div className="form-control">
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
                                            placeholder="모델 이름 입력..."
                                            value={newModelName}
                                            onChange={(e) => setNewModelName(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button 
                                            className="btn btn-sm btn-ghost"
                                            onClick={() => {
                                                setEditingModel(null);
                                                setNewModelName('');
                                            }}
                                        >
                                            취소
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={handleUpdateModel}
                                            disabled={processingModel === selectedModel.id}
                                        >
                                            {processingModel === selectedModel.id ? (
                                                <>
                                                    <Loader className="h-4 w-4 animate-spin mr-1" />
                                                    처리 중...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    저장
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-medium">{selectedModel.name}</h3>
                                    <button 
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => {
                                            setEditingModel(selectedModel.id);
                                            setNewModelName(selectedModel.name);
                                        }}
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        편집
                                    </button>
                                </div>
                            )}
                            
                            {/* 버전 관리 */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-medium">버전 관리</h4>
                                    <div className="badge badge-info">{selectedModel.versions?.length || 0}개 버전</div>
                                </div>
                                
                                {/* 버전 추가 폼 */}
                                <div className="card bg-base-100 shadow-md p-4 mb-4">
                                    <h4 className="font-medium mb-2">버전 추가</h4>
                                    <div className="flex gap-2">
                                        <div className="form-control flex-1">
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                placeholder="버전 입력 (예: v1.0, 2023.1 등)"
                                                value={newVersion}
                                                onChange={(e) => setNewVersion(e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={handleAddVersion}
                                            disabled={processingModel === selectedModel.id || !newVersion.trim()}
                                        >
                                            {processingModel === selectedModel.id ? (
                                                <Loader className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <PlusCircle className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* 버전 목록 */}
                                {selectedModel.versions?.length > 0 ? (
                                    <div className="card bg-base-100 shadow-md p-4">
                                        <h4 className="font-medium mb-4">버전 목록</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedModel.versions.map((version) => (
                                                <div key={version} className="badge badge-lg gap-1 p-3">
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    <span>{version}</span>
                                                    <button 
                                                        className="btn btn-xs btn-circle btn-ghost ml-1"
                                                        onClick={() => handleDeleteVersion(version)}
                                                        disabled={processingModel === selectedModel.id}
                                                    >
                                                        {processingModel === selectedModel.id ? (
                                                            <Loader className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <XCircle className="h-3 w-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-base-100 rounded-lg">
                                        <p className="text-gray-500">등록된 버전이 없습니다.</p>
                                    </div>
                                )}
                                
                                {/* 도움말 */}
                                <div className="alert alert-info mt-4">
                                    <div>
                                        <p className="text-sm">
                                            <strong>도움말:</strong> 이 페이지에서 관리하는 모델과 버전은 이미지 업로드 시 사용자가 선택할 수 있는 항목입니다.
                                            정확한 모델명과 버전을 입력해주세요.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-base-200 rounded-lg p-6 text-center">
                            <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">모델 상세 정보</h3>
                            <p className="text-gray-500">왼쪽 목록에서 모델을 선택하면 상세 정보가 여기에 표시됩니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminModelManager; 