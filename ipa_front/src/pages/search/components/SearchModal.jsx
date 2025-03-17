import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';

const SearchModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTarget, setSearchTarget] = useState('prompt');
    const [searchDate, setSearchDate] = useState('');
    const overlayRef = useRef(null);
    
    // 모달이 열릴 때 검색어 초기화
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            // 모달이 열리면 포커스 설정
            const timer = setTimeout(() => {
                const inputElement = document.getElementById('search-modal-input');
                if (inputElement) inputElement.focus();
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [isOpen]);
    
    // 디버깅: 모달이 열릴 때 오버레이 스타일 확인
    useEffect(() => {
        if (isOpen && overlayRef.current) {
            console.log('Overlay element:', overlayRef.current);
            console.log('Computed style:', window.getComputedStyle(overlayRef.current));
            console.log('Opacity value:', window.getComputedStyle(overlayRef.current).opacity);
            
            // 강제로 스타일 적용 시도
            overlayRef.current.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            console.log('Applied inline style');
        }
    }, [isOpen]);
    
    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    
    const handleSearch = (e) => {
        e.preventDefault();
        
        if (searchTarget === 'date' && searchDate) {
            navigate(`/search?target=${searchTarget}&date=${encodeURIComponent(searchDate)}`);
            onClose();
        } else if (searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}&target=${searchTarget}`);
            onClose();
        }
    };
    
    const searchTargets = [
        { value: 'prompt', label: '프롬프트' },
        { value: 'author', label: '작성자' },
        { value: 'model', label: '모델 이름' },
        { value: 'color', label: '색상 (베타)' },
        { value: 'date', label: '작성일' }
    ];
    
    if (!isOpen) return null;
    
    return (
        <>
            {/* 매우 약한 반투명 배경 오버레이 */}
            <div 
                ref={overlayRef}
                id="search-modal-overlay"
                className="fixed inset-0 z-[200]" 
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                onClick={onClose}
            ></div>
            
            <div className="fixed inset-0 z-[201] flex items-start justify-center pt-16 pointer-events-none">
                <div 
                    className="bg-base-100 rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl mx-4 p-6 animate-fadeIn pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">빠른 검색</h3>
                        <button 
                            className="btn btn-ghost btn-circle" 
                            onClick={onClose}
                        >
                            <X size={24} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSearch}>
                        <div className="join w-full mb-4">
                            {/* 왼쪽: 검색 대상 선택 */}
                            <select 
                                className="select select-bordered join-item w-1/3"
                                value={searchTarget}
                                onChange={(e) => setSearchTarget(e.target.value)}
                            >
                                {searchTargets.map(target => (
                                    <option key={target.value} value={target.value}>
                                        {target.label}
                                    </option>
                                ))}
                            </select>
                            
                            {/* 오른쪽: 검색어 입력 또는 날짜 선택 */}
                            {searchTarget === 'date' ? (
                                <input 
                                    type="date" 
                                    className="input input-bordered join-item w-2/3"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                />
                            ) : (
                                <input 
                                    id="search-modal-input"
                                    type="text" 
                                    className="input input-bordered join-item w-2/3"
                                    placeholder="검색어를 입력하세요"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            )}
                        </div>
                        
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={searchTarget === 'date' ? !searchDate : !searchQuery.trim()}
                            >
                                <SearchIcon size={20} />
                                검색
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-4 text-sm text-gray-500">
                        <p>팁: 검색 대상을 선택하고 {searchTarget === 'date' ? '날짜를 선택' : '검색어를 입력'}하세요. ESC 키를 눌러 닫을 수 있습니다.</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SearchModal; 