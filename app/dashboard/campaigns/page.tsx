"use client";
import React from "react";
import Link from "next/link";
import Card from "../_components/../_components/Card";
import ProgressBar from "../_components/../_components/ProgressBar";

export default function UserCampaignsPage() {
  const [items, setItems] = React.useState<Array<{ id: string; slug: string; status: string; urgency: string; goal?: { currency?: string; amountMinor?: number }; createdAt: string }>>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    fetch("/api/campaigns").then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        setItems(data);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Campaigns</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage your campaigns.</p>
        </div>
        <Link href="/user/campaigns/new" className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm shadow hover:bg-indigo-700 transition">New Campaign</Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.length === 0 && (
            <Card className="p-5"><div className="text-sm text-gray-600">No campaigns yet. Create your first campaign.</div></Card>
          )}
          {items.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium break-all">{c.slug}</h3>
                  <p className="text-xs text-gray-500 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <a href={`/user/campaigns/${c.id}`} className="text-sm text-indigo-600">Open</a>
              </div>
              <div className="mt-4">
                <ProgressBar value={Math.min(100, Math.round(((c.goal?.amountMinor ?? 0) === 0 ? 0 : 10)))} />
                <div className="mt-1 text-xs text-gray-500">{c.goal?.currency ?? "SLE"} {(c.goal?.amountMinor ?? 0) / 100}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


