"use client";

import { useState, useEffect } from "react";
import { Download, UserCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Comment = {
  id: string;
  authorName?: string | null;
  content: string;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WordsOfSupportSection({
  campaignId,
}: {
  campaignId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/support-card`);
      if (!res.ok) throw new Error("Failed to generate card");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `words-of-support.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch {
      // silently fail
    } finally {
      setDownloading(false);
    }
  };

  if (!loading && comments.length === 0) return null;

  return (
    <Card className="rounded-3xl border border-border/50 bg-card/70 shadow-xl backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Words of support
            {comments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </CardTitle>
          {comments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="h-4 w-4" />
              {downloading ? "Generating…" : "Download card"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-border/40 bg-muted/30 p-4"
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border border-border/60 bg-background/80 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <UserCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        {comment.authorName || "Anonymous"}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
