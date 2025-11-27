import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Shield } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  action?: 'edit' | 'delete' | 'create';
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const PermissionGuard = ({ 
  children, 
  action = 'edit',
  fallback = null,
  showMessage = false
}: PermissionGuardProps) => {
  const { canEdit, canDelete, canCreate } = usePermissions();

  const hasPermission = () => {
    switch (action) {
      case 'edit': return canEdit;
      case 'delete': return canDelete;
      case 'create': return canCreate;
      default: return false;
    }
  };

  if (!hasPermission()) {
    if (showMessage) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
          <Shield className="h-4 w-4" />
          <span>Owner permission required to {action} items</span>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
