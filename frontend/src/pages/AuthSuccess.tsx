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
      // Get user info from the token or a separate endpoint
      // For now, I'll fetch user info from an endpoint I'll add to the backend
      const fetchUser = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          login(accessToken, refreshToken, response.data);
          navigate('/');
        } catch (error) {
          console.error('Failed to fetch user after OAuth', error);
          navigate('/login?error=auth_failed');
        }
      };
      fetchUser();
    } else {
      navigate('/login');
    }
  }, [searchParams, login, navigate]);

  return <div className="flex items-center justify-center h-screen">Finalizing login...</div>;
};

export default AuthSuccess;
