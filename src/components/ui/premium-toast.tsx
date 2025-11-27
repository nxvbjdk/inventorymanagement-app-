import { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2), 0 2px 8px -2px rgba(0,0,0,0.1)',
          maxWidth: '420px',
        },
        // Success
        success: {
          duration: 3000,
          iconTheme: {
            primary: 'hsl(var(--success))',
            secondary: 'hsl(var(--success-foreground))',
          },
          style: {
            border: '1px solid hsl(var(--success) / 0.3)',
          },
        },
        // Error
        error: {
          duration: 5000,
          iconTheme: {
            primary: 'hsl(var(--destructive))',
            secondary: 'hsl(var(--destructive-foreground))',
          },
          style: {
            border: '1px solid hsl(var(--destructive) / 0.3)',
          },
        },
        // Loading
        loading: {
          iconTheme: {
            primary: 'hsl(var(--primary))',
            secondary: 'hsl(var(--primary-foreground))',
          },
        },
      }}
    />
  );
};

export { toast } from 'react-hot-toast';
