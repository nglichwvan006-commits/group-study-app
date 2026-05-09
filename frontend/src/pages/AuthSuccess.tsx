import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AuthSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      const fetchUser = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const response = await axios.get(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          login(accessToken, refreshToken, response.data);
          navigate('/');
        } catch (error: any) {
          console.error('Failed to fetch user after OAuth', error);
          alert(`Lỗi xác thực: ${error.response?.data?.message || error.message}`);
          navigate('/login?error=auth_failed');
        }
      };
      fetchUser();
    } else {
      alert("Lỗi: Không tìm thấy mã truy cập (Token) từ Google.");
      navigate('/login');
    }
  }, [searchParams, login, navigate]);

  return <div className="flex items-center justify-center h-screen">Finalizing login...</div>;
};

export default AuthSuccess;
