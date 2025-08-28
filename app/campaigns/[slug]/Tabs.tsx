"use client";

import { useState } from "react";

export type CampaignUpdateItem = {
  id: string;
  content: string;
  createdAt: string; // ISO string
};

export type CampaignCommentItem = {
  id: string;
  author?: string | null;
  content: string;
  createdAt: string;
};

type TabsProps = {
  story?: string | null;
  updates: CampaignUpdateItem[];
  comments?: CampaignCommentItem[];
};

export default function CampaignTabs({ story, updates, comments = [] }: TabsProps) {
  const [active, setActive] = useState<"story" | "updates" | "comments">("story");

  const baseBtn = "rounded-full border px-4 py-2 text-sm";
  const activeBtn = "bg-white text-gray-900";
  const inactiveBtn = "bg-neutral-50 text-gray-700";

  return (
    <div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
        <button
          type="button"
          className={`${baseBtn} ${active === "story" ? activeBtn : inactiveBtn}`}
          onClick={() => setActive("story")}
        >
          Story
        </button>
        <button
          type="button"
          className={`${baseBtn} ${active === "updates" ? activeBtn : inactiveBtn}`}
          onClick={() => setActive("updates")}
        >
          Updates ({updates.length})
        </button>
        <button
          type="button"
          className={`${baseBtn} ${active === "comments" ? activeBtn : inactiveBtn}`}
          onClick={() => setActive("comments")}
        >
          Comments ({comments.length})
        </button>
      </div>

      <div className="mt-6">
        {active === "story" && (
          <div className="text-sm md:text-base text-gray-800 whitespace-pre-line">{story || ""}</div>
        )}

        {active === "updates" && (
          <div className="space-y-4">
            {updates.length === 0 ? (
              <div className="text-sm text-gray-600">No updates yet.</div>
            ) : (
              updates.map((u) => (
                <article key={u.id} className="rounded-lg border p-4">
                  <div className="text-xs text-gray-600">{new Date(u.createdAt).toLocaleString()}</div>
                  <div className="mt-2 text-sm md:text-base text-gray-800 whitespace-pre-line">{u.content}</div>
                </article>
              ))
            )}
          </div>
        )}

        {active === "comments" && (
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-sm text-gray-600">No comments yet.</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-lg border p-4">
                  <div className="text-xs text-gray-600">
                    {c.author ? `${c.author} • ` : ""}
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm md:text-base text-gray-800 whitespace-pre-line">{c.content}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}


