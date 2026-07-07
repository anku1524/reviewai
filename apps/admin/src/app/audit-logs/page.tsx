"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type AuditLog = {
  id: string;
  action: string;
  metadata: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
  business: { name: string } | null;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await api.adminGetAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load audit logs history.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Audit compliance Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor system actions, changes made by administrators, user authentication log actions, and overrides.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500 border-collapse">
            <thead>
              <tr className="border-b border-slate-100 uppercase text-[10px] font-bold text-slate-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Business</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Metadata Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {log.user ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{log.user.name}</span>
                        <span className="text-[10px] text-slate-450">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="italic text-slate-400">Anonymous System</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {log.business ? log.business.name : "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase border bg-slate-50 border-slate-200 text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] max-w-[240px] truncate text-slate-500" title={log.metadata || ""}>
                    {log.metadata || "No metadata payload logged."}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No action logs found. Events will appear here as administrative actions occur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
