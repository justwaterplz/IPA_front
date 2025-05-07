import React, { createContext, useContext, useState, useEffect } from 'react';
import { modelService } from '@/utils/apiService';

// ModelContext 생성
const ModelContext = createContext(null);

// 모델 컨텍스트 제공자 컴포넌트
export const ModelProvider = ({ children }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 모델 목록 가져오기
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await modelService.getAllModels();
      setModels(data);
      console.log('모델 컨텍스트: 모델 목록 로드 완료', data);
    } catch (err) {
      console.error('모델 목록을 불러오는 데 실패했습니다:', err);
      setError('모델 목록을 불러오는 데 실패했습니다: ' + err.message);
      // 오류 발생 시에도 로딩 상태 종료
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 모델 목록 조회
  useEffect(() => {
    fetchModels();
  }, []);

  // 모델 추가
  const addModel = async (modelData) => {
    try {
      setLoading(true);
      setError(null);
      const newModel = await modelService.addModel(modelData);
      console.log('모델 추가 성공:', newModel);
      
      // 모델 목록에 새 모델 추가 (즉시 UI 업데이트)
      setModels(prevModels => [
        ...prevModels, 
        { ...newModel }
      ]);
      
      // 서버에서 최신 목록 다시 가져오기
      await fetchModels();
      return newModel;
    } catch (err) {
      console.error('모델 추가 중 오류 발생:', err);
      setError('모델 추가 중 오류가 발생했습니다: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 모델 수정
  const updateModel = async (modelId, modelData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedModel = await modelService.updateModel(modelId, modelData);
      console.log('모델 수정 성공:', updatedModel);
      
      // 모델 목록에서 수정된 모델 업데이트 (즉시 UI 업데이트)
      setModels(prevModels => 
        prevModels.map(model => 
          model.id === modelId ? { ...model, ...updatedModel } : model
        )
      );
      
      // 서버에서 최신 목록 다시 가져오기
      await fetchModels();
      return updatedModel;
    } catch (err) {
      console.error('모델 수정 중 오류 발생:', err);
      setError('모델 수정 중 오류가 발생했습니다: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 모델 삭제
  const deleteModel = async (modelId) => {
    try {
      setLoading(true);
      setError(null);
      await modelService.deleteModel(modelId);
      console.log('모델 삭제 성공:', modelId);
      
      // 모델 목록에서 삭제된 모델 제거 (즉시 UI 업데이트)
      setModels(prevModels => prevModels.filter(model => model.id !== modelId));
      
      // 서버에서 최신 목록 다시 가져오기
      await fetchModels();
      return true;
    } catch (err) {
      console.error('모델 삭제 중 오류 발생:', err);
      setError('모델 삭제 중 오류가 발생했습니다: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 모델 버전 추가
  const addModelVersion = async (modelId, versionData) => {
    try {
      setLoading(true);
      setError(null);
      await modelService.addModelVersion(modelId, versionData);
      console.log('모델 버전 추가 성공:', modelId, versionData);
      
      // 현재 모델 찾기
      const currentModel = models.find(model => model.id === modelId);
      if (currentModel) {
        // 모델 목록에서 버전이 추가된 모델 업데이트 (즉시 UI 업데이트)
        setModels(prevModels => 
          prevModels.map(model => 
            model.id === modelId 
              ? { 
                  ...model, 
                  versions: [...(model.versions || []), versionData.version] 
                } 
              : model
          )
        );
      }
      
      // 서버에서 최신 목록 다시 가져오기
      await fetchModels();
      return true;
    } catch (err) {
      console.error('모델 버전 추가 중 오류 발생:', err);
      setError('모델 버전 추가 중 오류가 발생했습니다: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 모델 버전 삭제
  const deleteModelVersion = async (modelId, version) => {
    try {
      setLoading(true);
      setError(null);
      await modelService.deleteModelVersion(modelId, version);
      console.log('모델 버전 삭제 성공:', modelId, version);
      
      // 모델 목록에서 버전이 삭제된 모델 업데이트 (즉시 UI 업데이트)
      setModels(prevModels => 
        prevModels.map(model => 
          model.id === modelId 
            ? { 
                ...model, 
                versions: (model.versions || []).filter(v => v !== version) 
              } 
            : model
        )
      );
      
      // 서버에서 최신 목록 다시 가져오기
      await fetchModels();
      return true;
    } catch (err) {
      console.error('모델 버전 삭제 중 오류 발생:', err);
      setError('모델 버전 삭제 중 오류가 발생했습니다: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 모델 컨텍스트 값
  const value = {
    models,
    loading,
    error,
    fetchModels,
    addModel,
    updateModel,
    deleteModel,
    addModelVersion,
    deleteModelVersion
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};

// Hook을 통해 ModelContext 사용
export const useModels = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModels must be used within a ModelProvider');
  }
  return context;
};

export default ModelContext; 