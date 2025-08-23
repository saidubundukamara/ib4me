
"use client";

type PageParams = {
  params: Promise<{ id: string }>;
};

import React from "react";
import Card from "../../_components/../_components/Card";
import ProgressBar from "../../_components/../_components/ProgressBar";
import DocumentUpload, { SelectedFile } from "../../_components/../_components/DocumentUpload";

export default function UserCampaignDetailPage({ params }: PageParams) {
  const [documents, setDocuments] = React.useState<SelectedFile[]>([]);
  const { id } = React.use(params);
  const [updates, setUpdates] = React.useState<{ id: string; content: string; createdAt: string }[]>([]);
  const [newUpdate, setNewUpdate] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  React.useEffect(() => {
    fetch(`/api/campaigns/${id}/updates`).then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setUpdates(data);
      }
    }).catch(() => undefined);
  }, [id]);

  async function postUpdate() {
    const content = newUpdate.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const created = await res.json();
        setUpdates((prev) => [created, ...prev]);
        setNewUpdate("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Campaign #{id}</h2>
            <span className="text-xs rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5">active</span>
            <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">urgency: medium</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Manage details, documents, updates and withdrawals.</p>
        </div>
        <a href="/user/withdrawals" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm shadow hover:bg-indigo-700 transition">Withdraw</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="font-medium">Overview</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                <div className="text-xs text-gray-500">Raised</div>
                <div className="text-xl font-semibold">SLE 9,178</div>
              </div>
              <div className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                <div className="text-xs text-gray-500">Target</div>
                <div className="text-xl font-semibold">SLE 12,000</div>
              </div>
              <div className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                <div className="text-xs text-gray-500">Donors</div>
                <div className="text-xl font-semibold">128</div>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={76} />
              <div className="mt-1 text-xs text-gray-500">76% of goal</div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Story</h3>
            <p className="text-sm text-gray-600 mt-2 leading-6">
              This is where the campaign story will be shown. Explain what happened, the treatment plan, and how funds will be used.
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Documents</h3>
            <div className="mt-3">
              <DocumentUpload value={documents} onChange={setDocuments} />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Updates</h3>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                <textarea
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  rows={3}
                  placeholder="Share a progress note or milestone..."
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-white/80 dark:bg-white/5"
                />
                <div className="mt-2 flex items-center justify-end">
                  <button onClick={postUpdate} disabled={submitting || !newUpdate.trim()} className="rounded-lg bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 text-xs hover:bg-indigo-700">Post update</button>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                {updates.length === 0 && <li className="text-gray-500">No updates yet.</li>}
                {updates.map((u) => (
                  <li key={u.id} className="rounded-xl border p-3 bg-white/70 dark:bg-white/5">
                    <div className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleString()}</div>
                    <div className="mt-1 whitespace-pre-wrap">{u.content}</div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-medium">Campaign Details</h3>
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Patient</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt className="text-gray-500">Age</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt className="text-gray-500">Hospital</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt className="text-gray-500">Diagnosis</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt className="text-gray-500">Emergency</dt>
                <dd>—</dd>
              </div>
              <div>
                <dt className="text-gray-500">Goal</dt>
                <dd>SLE —</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Quick Actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <button className="rounded-lg border px-3 py-2 hover:bg-indigo-50 dark:hover:bg-white/10">Share</button>
              <button className="rounded-lg border px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10">Edit</button>
              <button className="rounded-lg border px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10">Preview</button>
              <button className="rounded-lg border px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10">Settings</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


