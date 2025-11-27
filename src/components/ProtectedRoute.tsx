import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();
  const [forceReady, setForceReady] = useState(false);

  // Fallback timeout - if auth is still loading after 3 seconds, force check
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('Auth loading timeout - forcing ready state');
        setForceReady(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  if (loading && !forceReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
