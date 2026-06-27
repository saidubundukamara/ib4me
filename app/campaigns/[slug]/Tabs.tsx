"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send, Loader2, UserCircle2, ChevronDown, ChevronUp } from "lucide-react";

export type CampaignUpdateItem = {
  id: string;
  content: string;
  createdAt: string;
};

export type CampaignCommentItem = {
  id: string;
  authorName?: string | null;
  content: string;
  createdAt: string;
};

type TabsProps = {
  story?: string | null;
  updates: CampaignUpdateItem[];
  campaignId: string;
};

const MAX_COMMENT = 500;
const STORY_COLLAPSE_PX = 200; // height in px before "See more" appears

const tabItems: Array<{ key: "story" | "updates" | "comments"; label: string }> = [
  { key: "story", label: "Story" },
  { key: "updates", label: "Updates" },
  { key: "comments", label: "Comments" },
];

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

export default function CampaignTabs({ story, updates, campaignId }: TabsProps) {
  const [active, setActive] = useState<"story" | "updates" | "comments">("story");
  const [comments, setComments] = useState<CampaignCommentItem[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Story expand/collapse
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [storyOverflows, setStoryOverflows] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [justPosted, setJustPosted] = useState(false);

  // Detect whether the story content is taller than the collapsed height
  useEffect(() => {
    const el = storyRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setStoryOverflows(el.scrollHeight > STORY_COLLAPSE_PX + 10);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [story]);

  const loadComments = useCallback(async () => {
    if (commentsLoaded) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/comments`);
      if (res.ok) {
        const data: CampaignCommentItem[] = await res.json();
        setComments(data);
      }
    } finally {
      setCommentsLoading(false);
      setCommentsLoaded(true);
    }
  }, [campaignId, commentsLoaded]);

  // Preload comments in the background so the tab feels instant
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleTabChange = (key: "story" | "updates" | "comments") => {
    setActive(key);
    if (key === "comments" && !commentsLoaded) loadComments();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) { setFormError("Please write a message."); return; }
    if (trimmed.length > MAX_COMMENT) { setFormError(`Max ${MAX_COMMENT} characters.`); return; }
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name.trim() || null, content: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError((err as { error?: string }).error || "Failed to post. Try again.");
        return;
      }
      const newComment: CampaignCommentItem = await res.json();
      setComments((prev) => [newComment, ...prev]);
      setMessage("");
      setName("");
      setJustPosted(true);
      setTimeout(() => setJustPosted(false), 3000);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const commentCount = commentsLoaded ? comments.length : undefined;

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-full bg-muted/60 p-1">
        {tabItems.map((tab) => {
          const count =
            tab.key === "updates"
              ? updates.length
              : tab.key === "comments" && commentsLoaded
                ? commentCount
                : undefined;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
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

      {/* Story */}
      {active === "story" && (
        <div className="rounded-2xl border border-border/50 bg-background/80 overflow-hidden">
          {story ? (
            <>
              {/* Content area — height clamped when collapsed */}
              <div
                ref={storyRef}
                style={!storyExpanded ? { maxHeight: STORY_COLLAPSE_PX } : undefined}
                className="relative overflow-hidden p-5 text-sm leading-relaxed text-muted-foreground whitespace-pre-line md:text-base transition-[max-height] duration-500 ease-in-out"
              >
                {story}

                {/* Gradient fade-out at the bottom when collapsed */}
                {storyOverflows && !storyExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/95 to-transparent pointer-events-none" />
                )}
              </div>

              {/* See more / See less button */}
              {storyOverflows && (
                <div className="border-t border-border/40 px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setStoryExpanded((v) => !v)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                    aria-expanded={storyExpanded}
                  >
                    {storyExpanded ? (
                      <><ChevronUp className="w-4 h-4" /> See less</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> See more</>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-5 text-sm text-muted-foreground">
              This campaign has not added a story yet.
            </div>
          )}
        </div>
      )}

      {/* Updates */}
      {active === "updates" && (
        <div className="space-y-4">
          {updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No updates yet. Check back later for progress.
            </div>
          ) : (
            updates.map((update) => (
              <Card key={update.id} className="rounded-2xl border border-border/60 bg-background/80 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base font-semibold text-foreground">Campaign Update</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.createdAt).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{update.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Comments */}
      {active === "comments" && (
        <div className="space-y-6">
          {/* Post a comment form */}
          <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Leave a comment</h3>
            {justPosted && (
              <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Your comment was posted successfully!
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="comment-name" className="text-sm">
                  Name <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="comment-name"
                  placeholder="Your name or leave blank to post anonymously"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  disabled={submitting}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="comment-message" className="text-sm">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <span className={`text-xs ${message.length > MAX_COMMENT * 0.9 ? "text-red-500" : "text-muted-foreground"}`}>
                    {message.length}/{MAX_COMMENT}
                  </span>
                </div>
                <Textarea
                  id="comment-message"
                  placeholder="Share your support, encouragement, or words of hope..."
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setFormError(null); }}
                  rows={3}
                  maxLength={MAX_COMMENT + 10}
                  disabled={submitting}
                  className="rounded-xl resize-none"
                />
                {formError && <p className="text-xs text-red-500">{formError}</p>}
              </div>
              <Button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Post Comment</>
                )}
              </Button>
            </form>
          </div>

          {/* Comments list */}
          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border/40 bg-muted/30 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="h-4 w-28 rounded bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-4/5 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-8 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-foreground">No comments yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to leave a message of support.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-2xl border border-border/60 bg-background/80 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <UserCircle2 className="h-5 w-5 text-primary" />
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
                      <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
