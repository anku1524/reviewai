type Props = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-white py-14 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      <p className="max-w-xs text-sm text-slate-500">{description}</p>
      {action}
    </div>
  );
}
