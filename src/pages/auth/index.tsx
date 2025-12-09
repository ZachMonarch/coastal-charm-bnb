// src/pages/auth/index.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthHandler() {
  const [status, setStatus] = useState('Processing authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const reset = params.get('reset');
    const login = params.get('login');

    async function handleAuthFlow() {
      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('Auth error:', error.message);
          setStatus('Authentication failed. Please request a new link.');
          return;
        }

        console.log('User session established:', data.session);

        if (reset === 'true') {
          // Password reset flow
          setStatus('Redirecting to password reset form...');
          navigate('/auth/reset-password', { replace: true });
        } else if (login === 'true') {
          // Magic link login flow
          setStatus('Login successful. Redirecting...');
          navigate('/dashboard', { replace: true });
        } else {
          setStatus('Authenticated. Redirecting...');
          navigate('/', { replace: true });
        }
      } else {
        setStatus('Invalid or expired link. Please request a new one.');
      }
    }

    handleAuthFlow();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-foreground">{status}</h2>
      </div>
    </div>
  );
}
