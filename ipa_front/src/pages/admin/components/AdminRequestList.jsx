import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    User, 
    Calendar, 
    CheckCircle, 
    XCircle, 
    Loader,
    Search,
    Filter,
    RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { userService } from '@/utils/apiService';
import { API_BASE_URL } from '@/utils/apiService';

const AdminRequestList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [processingId, setProcessingId] = useState(null);

    // 요청 목록 가져오기
    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // API 호출
            const response = await userService.getAdminRequests({
                page,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchTerm || undefined
            });
            
            // 응답 데이터 처리
            if (response.results) {
                setRequests(response.results);
                setTotalPages(Math.ceil(response.count / 10)); // 페이지당 10개 항목 가정
            } else {
                setRequests(response);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('요청 목록을 가져오는 중 오류 발생:', err);
            setError('요청 목록을 불러오는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 요청 목록 가져오기
    useEffect(() => {
        fetchRequests();
    }, [page, statusFilter]);

    // 검색 처리
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // 검색 시 첫 페이지로 이동
        fetchRequests();
    };

    // 요청 처리 (승인/거부)
    const handleProcessRequest = async (requestId, action) => {
        try {
            setProcessingId(requestId);
            
            // API 호출 - 백엔드 엔드포인트 업데이트
            await userService.processAdminRequest(requestId, action);
            
            // 성공 시 목록 갱신
            fetchRequests();
            
            // 선택된 요청이 처리된 경우 선택 해제
            if (selectedRequest?.id === requestId) {
                setSelectedRequest(null);
            }
        } catch (err) {
            console.error(`요청 ${action} 처리 중 오류 발생:`, err);
            alert(`요청 처리 중 오류가 발생했습니다: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    // 요청 상세 보기
    const handleViewRequest = (request) => {
        setSelectedRequest(request);
    };

    // 요청 상태에 따른 배지 스타일
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="badge badge-warning">대기 중</span>;
            case 'approved':
                return <span className="badge badge-success">승인됨</span>;
            case 'rejected':
                return <span className="badge badge-error">거부됨</span>;
            default:
                return <span className="badge badge-ghost">알 수 없음</span>;
        }
    };

    // 프로필 이미지 URL 가져오기 함수 추가
    const getProfileImageUrl = (user) => {
        if (!user) return null;
        
        // 우선순위: 1. profile_image 2. 기본 이미지
        let imageUrl = null;
        
        if (user.profile_image) {
            console.log('AdminRequestList: 사용자 객체에서 프로필 이미지 URL 사용:', user.profile_image);
            imageUrl = user.profile_image;
        } 
        
        // 이미지가 없는 경우 기본 이미지 반환
        if (!imageUrl) {
            const initial = user?.username?.charAt(0) || 'U';
            return `https://placehold.co/100x100/9370DB/FFFFFF?text=${initial}`;
        }
        
        // 상대 경로를 절대 경로로 변환
        if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
            imageUrl = `${API_BASE_URL}${imageUrl}`;
        }
        
        // 타임스탬프 추가 (캐시 방지)
        if (!imageUrl.includes('t=')) {
            const timestamp = new Date().getTime();
            imageUrl = imageUrl.includes('?') 
                ? `${imageUrl}&t=${timestamp}` 
                : `${imageUrl}?t=${timestamp}`;
        }
        
        return imageUrl;
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span>사용자 요청 관리</span>
            </h2>

            {/* 검색 및 필터링 */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="사용자명 또는 요청 내용 검색..."
                            className="input input-bordered w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                            <Search className="h-5 w-5" />
                        </button>
                    </div>
                </form>
                
                <div className="flex gap-2">
                    <div className="form-control">
                        <select
                            className="select select-bordered"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">모든 상태</option>
                            <option value="pending">대기 중</option>
                            <option value="approved">승인됨</option>
                            <option value="rejected">거부됨</option>
                        </select>
                    </div>
                    
                    <button 
                        className="btn btn-outline" 
                        onClick={fetchRequests}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="alert alert-error mb-4">
                    <XCircle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* 요청 목록 및 상세 정보 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 요청 목록 */}
                <div className="lg:col-span-2">
                    <div className="bg-base-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>사용자</th>
                                        <th>유형</th>
                                        <th>상태</th>
                                        <th>날짜</th>
                                        <th>액션</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-8">
                                                <Loader className="h-8 w-8 animate-spin mx-auto text-primary" />
                                                <p className="mt-2 text-gray-500">요청 목록을 불러오는 중...</p>
                                            </td>
                                        </tr>
                                    ) : requests.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-8">
                                                <MessageSquare className="h-8 w-8 mx-auto text-gray-400" />
                                                <p className="mt-2 text-gray-500">요청이 없습니다.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map((request) => (
                                            <tr 
                                                key={request.id}
                                                className={`hover:bg-base-300 cursor-pointer ${selectedRequest?.id === request.id ? 'bg-base-300' : ''}`}
                                                onClick={() => handleViewRequest(request)}
                                            >
                                                <td className="font-mono text-xs">
                                                    {request.id.substring(0, 8)}...
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="avatar">
                                                            <div className="w-8 rounded-full">
                                                                <img 
                                                                    src={getProfileImageUrl(request.user)} 
                                                                    alt={request.user.username} 
                                                                    onError={(e) => {
                                                                        console.error('AdminRequestList: 프로필 이미지 로딩 실패');
                                                                        e.target.onerror = null;
                                                                        e.target.src = `https://placehold.co/100x100/9370DB/FFFFFF?text=${request.user.username.charAt(0) || 'U'}`;
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span>{request.user.username}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {request.type === 'general_request' && '일반 요청'}
                                                    {request.type === 'permission_request' && '권한 요청'}
                                                    {request.type === 'feature_request' && '기능 요청'}
                                                    {request.type === 'bug_report' && '버그 신고'}
                                                </td>
                                                <td>{getStatusBadge(request.status)}</td>
                                                <td>
                                                    <div className="tooltip" data-tip={new Date(request.created_at).toLocaleString()}>
                                                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ko })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-1">
                                                        {request.status === 'pending' && (
                                                            <>
                                                                <button 
                                                                    className="btn btn-xs btn-success"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleProcessRequest(request.id, 'approve');
                                                                    }}
                                                                    disabled={processingId === request.id}
                                                                >
                                                                    {processingId === request.id ? (
                                                                        <Loader className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle className="h-3 w-3" />
                                                                    )}
                                                                </button>
                                                                <button 
                                                                    className="btn btn-xs btn-error"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleProcessRequest(request.id, 'reject');
                                                                    }}
                                                                    disabled={processingId === request.id}
                                                                >
                                                                    {processingId === request.id ? (
                                                                        <Loader className="h-3 w-3 animate-spin" />
                                                                    ) : (
                                                                        <XCircle className="h-3 w-3" />
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* 페이지네이션 */}
                        <div className="flex justify-center py-4">
                            <div className="btn-group">
                                <button 
                                    className="btn btn-sm" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || loading}
                                >
                                    «
                                </button>
                                <button className="btn btn-sm">
                                    페이지 {page} / {totalPages}
                                </button>
                                <button 
                                    className="btn btn-sm" 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || loading}
                                >
                                    »
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 요청 상세 정보 */}
                <div className="lg:col-span-1">
                    {selectedRequest ? (
                        <div className="bg-base-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                                <span>요청 상세 정보</span>
                                {getStatusBadge(selectedRequest.status)}
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>요청자</span>
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <div className="avatar">
                                            <div className="w-10 rounded-full">
                                                <img 
                                                    src={getProfileImageUrl(selectedRequest.user)} 
                                                    alt={selectedRequest.user.username} 
                                                    onError={(e) => {
                                                        console.error('AdminRequestList: 프로필 이미지 로딩 실패');
                                                        e.target.onerror = null;
                                                        e.target.src = `https://placehold.co/100x100/9370DB/FFFFFF?text=${selectedRequest.user.username.charAt(0) || 'U'}`;
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-medium">{selectedRequest.user.username}</p>
                                            <p className="text-sm text-gray-500">{selectedRequest.user.email}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>요청 일시</span>
                                    </h4>
                                    <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        <Filter className="h-4 w-4" />
                                        <span>요청 유형</span>
                                    </h4>
                                    <p>
                                        {selectedRequest.type === 'general_request' && '일반 요청'}
                                        {selectedRequest.type === 'permission_request' && '권한 요청'}
                                        {selectedRequest.type === 'feature_request' && '기능 요청'}
                                        {selectedRequest.type === 'bug_report' && '버그 신고'}
                                    </p>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        <span>요청 내용</span>
                                    </h4>
                                    <div className="bg-base-100 p-3 rounded-lg whitespace-pre-wrap">
                                        {selectedRequest.message}
                                    </div>
                                </div>
                                
                                {selectedRequest.admin_note && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">관리자 메모</h4>
                                        <div className="bg-base-100 p-3 rounded-lg whitespace-pre-wrap">
                                            {selectedRequest.admin_note}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedRequest.status === 'pending' && (
                                    <div className="flex gap-2 mt-6">
                                        <button 
                                            className="btn btn-success flex-1"
                                            onClick={() => handleProcessRequest(selectedRequest.id, 'approve')}
                                            disabled={processingId === selectedRequest.id}
                                        >
                                            {processingId === selectedRequest.id ? (
                                                <Loader className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                            )}
                                            승인
                                        </button>
                                        <button 
                                            className="btn btn-error flex-1"
                                            onClick={() => handleProcessRequest(selectedRequest.id, 'reject')}
                                            disabled={processingId === selectedRequest.id}
                                        >
                                            {processingId === selectedRequest.id ? (
                                                <Loader className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <XCircle className="h-4 w-4 mr-2" />
                                            )}
                                            거부
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-base-200 rounded-lg p-6 text-center">
                            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">요청 상세 정보</h3>
                            <p className="text-gray-500">왼쪽 목록에서 요청을 선택하면 상세 정보가 여기에 표시됩니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminRequestList; 