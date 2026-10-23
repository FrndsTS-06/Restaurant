import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({
  icon,
  title = 'Nothing here yet',
  description = 'There are currently no items to display in this section.',
  action,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#13151b]/50 border border-white/5 ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
        {icon || <PackageOpen size={32} strokeWidth={1.5} />}
      </div>
      <h3 className="font-serif text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
