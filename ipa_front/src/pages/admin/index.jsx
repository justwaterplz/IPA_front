import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/pages/auth/components/AuthContext';
import { Shield, Users, MessageSquare, Settings, Loader, ArrowLeft } from 'lucide-react';
import AdminRequestList from './components/AdminRequestList';
import AdminLayout from './components/AdminLayout';

const AdminPanel = () => {
    const { user, userRole } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('requests');
    const [isLoading, setIsLoading] = useState(false);

    // 관리자가 아닌 경우 리디렉션
    useEffect(() => {
        if (user && userRole !== 'admin') {
            navigate('/');
        }
    }, [user, userRole, navigate]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        <span>관리자 패널</span>
                    </h1>
                    <Link to="/settings" className="btn btn-outline btn-sm">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        설정으로 돌아가기
                    </Link>
                </div>

                {/* 탭 메뉴 */}
                <div className="tabs tabs-boxed mb-6">
                    <button 
                        className={`tab ${activeTab === 'requests' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        사용자 요청
                    </button>
                    <button 
                        className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        사용자 관리
                    </button>
                    <button 
                        className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        설정
                    </button>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="bg-base-100 rounded-lg shadow-lg p-6">
                    {activeTab === 'requests' && (
                        <AdminRequestList />
                    )}
                    {activeTab === 'users' && (
                        <div className="text-center py-8">
                            <h2 className="text-xl font-semibold mb-4">사용자 관리</h2>
                            <p className="text-gray-500">이 기능은 아직 개발 중입니다.</p>
                        </div>
                    )}
                    {activeTab === 'settings' && (
                        <div className="text-center py-8">
                            <h2 className="text-xl font-semibold mb-4">관리자 설정</h2>
                            <p className="text-gray-500">이 기능은 아직 개발 중입니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPanel; 