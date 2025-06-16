
import { ShieldCheck, Frown } from "lucide-react";

interface AlertProps {
  type?: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
}

export default function LovableAlert({ type = "info", children }: AlertProps) {
  let bg = "bg-blue-50";
  let color = "text-blue-700";
  let icon = <ShieldCheck size={18} className="text-blue-500" />;
  if (type === "success") { bg = "bg-green-100"; color = "text-green-800"; icon = <ShieldCheck size={18} className="text-green-500" />; }
  if (type === "error") { bg = "bg-red-100"; color = "text-red-700"; icon = <Frown size={18} className="text-red-500" />; }
  if (type === "warning") { bg = "bg-yellow-50"; color = "text-yellow-700"; icon = <Frown size={18} className="text-yellow-500" />; }

  return (
    <div className={`flex items-center gap-2 ${bg} rounded-lg px-4 py-2 mt-2 animate-fade-in`}>
      <span>{icon}</span>
      <span className={`text-xs ${color}`}>{children}</span>
    </div>
  );
}
