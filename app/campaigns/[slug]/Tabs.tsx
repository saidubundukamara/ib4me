"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export type CampaignUpdateItem = {
  id: string;
  content: string;
  createdAt: string;
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

const tabItems: Array<{
  key: "story" | "updates" | "comments";
  label: string;
}> = [
  { key: "story", label: "Story" },
  { key: "updates", label: "Updates" },
  { key: "comments", label: "Comments" },
];

export default function CampaignTabs({
  story,
  updates,
  comments = [],
}: TabsProps) {
  const [active, setActive] = useState<"story" | "updates" | "comments">("story");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-full bg-muted/60 p-1">
        {tabItems.map((tab) => {
          const count =
            tab.key === "updates"
              ? updates.length
              : tab.key === "comments"
                ? comments.length
                : undefined;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`flex-1 min-w-[100px] rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
              {typeof count === "number" ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {active === "story" && (
        <div className="rounded-2xl border border-border/50 bg-background/80 p-5 text-sm leading-relaxed text-muted-foreground whitespace-pre-line md:text-base">
          {story ? story : "This campaign has not added a story yet."}
        </div>
      )}

      {active === "updates" && (
        <div className="space-y-4">
          {updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No updates yet. Check back later for progress.
            </div>
          ) : (
            updates.map((update) => (
              <Card
                key={update.id}
                className="rounded-2xl border border-border/60 bg-background/80 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Campaign Update
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {update.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {active === "comments" && (
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-8 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-foreground">No comments yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Comments will appear here once supporters share their messages.
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border border-border/60 bg-background/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {comment.author || "Anonymous"}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
