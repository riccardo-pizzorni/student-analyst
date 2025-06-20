import { Star } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  type?: 'milestone' | 'achievement';
}

export default function Badge({ children, type }: BadgeProps) {
  let bg = 'bg-gradient-to-r from-blue-500 to-fuchsia-400 text-white';
  if (type === 'milestone')
    bg = 'bg-gradient-to-tr from-green-400 to-blue-400 text-white';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs rounded-full px-3 py-1 font-bold shadow ${bg} animate-pulse`}
    >
      <Star size={14} className="mr-1" />
      {children}
    </span>
  );
}
