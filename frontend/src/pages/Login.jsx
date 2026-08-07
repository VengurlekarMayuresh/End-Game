import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import api from '../lib/axios';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (user) {
    const path = user.role === 'RECRUITER' ? '/recruiter' : user.role === 'ADMIN' ? '/admin' : '/student';
    return <Navigate to={path} replace />;
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await api.post('/auth/google', { token: credentialResponse.credential });
      login(data.user, data.accessToken);

      if (data.user.status === 'PENDING') {
        navigate('/onboarding/role');
      } else {
        navigate(`/${data.user.role.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Login Failed:', error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-2xl border border-border shadow-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl">
            <Briefcase size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to HireSense AI</h1>
        <p className="text-muted-foreground mb-8">Sign in or create an account to continue</p>

        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.error('Google Login Failed')}
            useOneTap
            shape="rectangular"
            theme="outline"
            size="large"
          />
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Are you an administrator?{' '}
            <Link to="/admin-login" className="text-primary hover:underline font-medium">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
