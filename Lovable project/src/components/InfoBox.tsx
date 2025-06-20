import { Info } from 'lucide-react';

export default function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-blue-50 border-l-4 border-blue-400 rounded p-3 mt-3 animate-fade-in">
      <Info className="text-blue-400 mt-1" size={18} />
      <span className="text-xs text-blue-900">{children}</span>
    </div>
  );
}
