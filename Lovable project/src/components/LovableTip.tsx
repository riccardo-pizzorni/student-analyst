import { Lightbulb } from 'lucide-react';

export default function LovableTip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 bg-fuchsia-100 rounded-lg px-3 py-2 my-2 animate-fade-in pulse">
      <div className="bg-fuchsia-300 text-white p-1 rounded-full flex items-center">
        <Lightbulb className="animate-pulse" size={16} />
      </div>
      <span className="text-xs text-fuchsia-800 font-medium">{children}</span>
    </div>
  );
}
