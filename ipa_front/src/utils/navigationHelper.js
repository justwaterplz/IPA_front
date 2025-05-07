/**
 * 네비게이션 및 인증 문제를 해결하기 위한 유틸리티 함수
 */

// 로그아웃 처리 및 로그인 페이지로 이동
export const logoutAndRedirect = () => {
  console.log('로그아웃 처리 및 로그인 페이지로 이동');
  
  try {
    // 모든 인증 토큰 제거
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_token');  // API 서비스에서 사용하는 토큰 이름
    localStorage.removeItem('refresh_token');
    
    // 모든 스토리지 데이터 정리
    localStorage.clear();
    sessionStorage.clear();
    
    // 캐시 무효화를 위한 메타 태그 추가
    const meta = document.createElement('meta');
    meta.httpEquiv = 'pragma';
    meta.content = 'no-cache';
    document.head.appendChild(meta);
    
    // 캐시 무효화를 위한 쿠키 설정
    document.cookie = "cache=none; path=/; max-age=0";
    
    console.log('로그아웃 처리 완료, 로그인 페이지로 이동합니다.');
    
    // 페이지 이동 전 짧은 지연 설정 (모든 리소스 해제에 시간을 주기 위함)
    setTimeout(() => {
      // window.location.replace 대신 = 할당 사용
      window.location = '/login';
    }, 50);
    
  } catch (error) {
    console.error('로그아웃 처리 중 오류 발생:', error);
    // 오류가 발생해도 강제로 로그인 페이지로 이동
    window.location = '/login';
  }
};

// 메인 페이지로 이동
export const navigateToMain = () => {
  console.log('메인 페이지로 이동');
  
  // 브라우저 캐시 관련 설정 추가
  document.cookie = "cache=none; path=/; max-age=0";
  
  // 메인 페이지로 직접 이동 (할당 연산자 사용)
  window.location = '/';
};

// 지정된 경로로 이동
export const navigateTo = (path) => {
  console.log(`${path}로 이동`);
  
  // 브라우저 캐시 관련 설정 추가
  document.cookie = "cache=none; path=/; max-age=0";
  
  // 지정된 경로로 직접 이동
  window.location = path;
}; 