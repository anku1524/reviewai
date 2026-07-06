type Props = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
};

export function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${accent ? "border-slate-900" : "border-slate-200"}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-slate-900" : "text-slate-800"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
