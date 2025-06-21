interface ProgressBarProps {
  progress: number;
  label: string;
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({
  progress: _progress,
  label,
  currentStep: _currentStep,
  totalSteps: _totalSteps,
}: ProgressBarProps) {
  return (
    <div className="dark-card rounded-xl p-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-medium text-blue-300">{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-300">Sistema Attivo</span>
        </div>
      </div>
    </div>
  );
}
