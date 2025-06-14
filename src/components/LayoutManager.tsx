import React, { useEffect, useState } from 'react';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';

interface LayoutManagerProps {
  children: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
  onStepChange?: (step: number) => void;
  sidebarContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
}

const DESKTOP_MIN_WIDTH = 1024;

export const LayoutManager: React.FC<LayoutManagerProps> = ({
  children,
  currentStep = 1,
  totalSteps = 4,
  onStepChange = () => {},
  sidebarContent,
  headerContent,
  className = '',
}) => {
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (width >= DESKTOP_MIN_WIDTH) {
    return (
      <DesktopLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepChange={onStepChange}
        sidebarContent={sidebarContent}
        headerContent={headerContent}
        className={className}
      >
        {children}
      </DesktopLayout>
    );
  } else {
    return (
      <MobileLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        onStepChange={onStepChange}
        sidebarContent={sidebarContent}
        headerContent={headerContent}
        className={className}
      >
        {children}
      </MobileLayout>
    );
  }
};

export default LayoutManager; 