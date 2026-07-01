import { FileText, Link, Calendar, Info, Trash2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RightPanel({
  group,
  onDeleteGroup,
  isDeleting,
}) {
  if (!group) return null;

  const dateStr = group.createdAt
    ? new Date(group.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  // Static mockup files and links to represent a fully featured chat app without breaking backend
  const mockFiles = [
    { name: 'Project_Specification.pdf', size: '1.2 MB', date: 'Today' },
    { name: 'Logo_Assets.zip', size: '4.8 MB', date: 'Yesterday' },
    { name: 'Meeting_Notes.txt', size: '14 KB', date: 'Jun 25' },
  ];

  const mockLinks = [
    { title: 'Project Board', url: 'https://github.com/project-board' },
    { title: 'Design Mockups', url: 'https://figma.com/design-files' },
  ];

  return (
    <div className="h-full w-[320px] bg-sidebar border-l border-border/80 text-primary flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border/60 flex items-center gap-2">
        <Info size={16} className="text-brand" />
        <h3 className="font-semibold text-sm select-none">Details</h3>
      </div>

      {/* Info Section */}
      <div className="p-5 border-b border-border/60 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center mb-3 text-lg font-semibold select-none">
          {group.groupName.slice(0, 2).toUpperCase()}
        </div>
        <h4 className="font-semibold text-base break-all max-w-full px-2">{group.groupName}</h4>
        <div className="flex items-center gap-1.5 text-xs text-secondary mt-1.5 select-none">
          <Calendar size={13} />
          <span>Created: {dateStr}</span>
        </div>
      </div>

      {/* Shared Files & Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 select-none">
        {/* Shared Files */}
        <div>
          <h5 className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-2.5">
            Shared Files ({mockFiles.length})
          </h5>
          <div className="space-y-2">
            {mockFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-surface/50 border border-border/50 hover:border-brand/20 transition-all duration-200"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={15} className="text-secondary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate text-primary">{file.name}</p>
                    <p className="text-[10px] text-secondary">{file.size} • {file.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shared Links */}
        <div>
          <h5 className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-2.5">
            Shared Links ({mockLinks.length})
          </h5>
          <div className="space-y-2">
            {mockLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface/50 border border-border/50 hover:border-brand/20 text-xs text-secondary hover:text-brand transition-all duration-200"
              >
                <Link size={14} className="shrink-0 text-secondary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-primary truncate">{link.title}</p>
                  <p className="text-[10px] text-secondary truncate">{link.url}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone (Delete conversation) */}
      <div className="p-4 border-t border-border/60 bg-surface/10 select-none">
        <h5 className="text-[10px] font-semibold text-danger uppercase tracking-wider mb-2.5 flex items-center gap-1">
          <ShieldAlert size={12} />
          <span>Danger Zone</span>
        </h5>
        <button
          onClick={onDeleteGroup}
          disabled={isDeleting}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-ring"
        >
          <Trash2 size={13} className="interactive-destructive" />
          <span>{isDeleting ? 'Deleting…' : 'Delete Group'}</span>
        </button>
      </div>
    </div>
  );
}
