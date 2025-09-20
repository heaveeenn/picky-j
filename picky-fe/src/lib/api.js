import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 요청 인터셉터: 모든 요청에 액세스 토큰을 자동으로 추가합니다.
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 발생 시 토큰 재발급을 시도합니다.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도한 요청이 아닐 경우
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 플래그 설정

      try {
        // 토큰 재발급 요청 (백엔드는 httpOnly 쿠키의 리프레시 토큰을 사용)
        const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/refresh`, {}, {
          withCredentials: true,
        });

        const newAccessToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        // 원래 요청을 다시 시도
        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 재발급 실패 시 사용자 로그아웃 처리
        console.error('토큰 재발급에 실패하여 로그아웃합니다.', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        window.location.href = '/'; 
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;