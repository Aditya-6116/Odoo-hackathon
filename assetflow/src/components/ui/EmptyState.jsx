import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No data found.', icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 rounded-full bg-surface-700/40 mb-4">
        <Icon size={28} className="text-slate-500" />
      </div>
      <p className="text-slate-400 text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
