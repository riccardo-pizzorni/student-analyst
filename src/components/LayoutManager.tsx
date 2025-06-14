import React from 'react';
import DesktopLayout from './DesktopLayout';

interface LayoutManagerProps {
  children: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
  onStepChange?: (step: number) => void;
  sidebarContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
}

const LayoutManager: React.FC<LayoutManagerProps> = ({
  children,
  currentStep = 1,
  totalSteps = 4,
  onStepChange = () => {},
  sidebarContent,
  headerContent,
  className = '',
}) => {
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
};

export default LayoutManager; 