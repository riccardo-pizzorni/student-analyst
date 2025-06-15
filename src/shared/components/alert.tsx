import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive';
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ children, className = '', variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`relative w-full rounded-lg border p-4 ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className = '' }) => (
  <div className={`text-sm ${className}`}>
    {children}
  </div>
); 