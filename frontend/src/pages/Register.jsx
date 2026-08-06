import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import api from '../lib/axios';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

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
      console.error('Registration Failed:', error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-2xl border border-border shadow-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl">
            <UserPlus size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Create an Account</h1>
        <p className="text-muted-foreground mb-8">Join HireSense AI seamlessly with your Google Account.</p>

        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.error('Google Registration Failed')}
            useOneTap
            shape="rectangular"
            theme="outline"
            size="large"
            text="signup_with"
          />
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
