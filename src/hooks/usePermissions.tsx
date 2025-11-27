import { useAuth } from '@/context/AuthContext';

export const usePermissions = () => {
  const { profile, isOwner } = useAuth();

  return {
    canEdit: isOwner,
    canDelete: isOwner,
    canCreate: isOwner,
    isOwner,
    isViewer: profile?.user_role === 'viewer',
    role: profile?.user_role
  };
};
