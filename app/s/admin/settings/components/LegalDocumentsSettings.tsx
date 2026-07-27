"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Eye, EyeOff, Shield, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface LegalDoc {
  content?: string;
  effectiveDate?: string;
  lastUpdatedAt?: string;
}

interface DocEditorProps {
  docType: "privacyPolicy" | "termsOfService";
  initial: LegalDoc;
}

function DocEditor({ docType, initial }: DocEditorProps) {
  const [content, setContent] = useState(initial.content ?? "");
  const [effectiveDate, setEffectiveDate] = useState(initial.effectiveDate ?? "");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    initial.lastUpdatedAt ?? null
  );

  const lastUpdated = lastSavedAt
    ? new Date(lastSavedAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings?category=legalDocuments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, content, effectiveDate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      const saved: string | undefined =
        json.settings?.[docType]?.lastUpdatedAt;
      setLastSavedAt(saved ?? new Date().toISOString());
      toast.success("Document saved successfully");
      setHasChanges(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Metadata row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor={`${docType}-date`}>Effective Date (shown on public page)</Label>
          <Input
            id={`${docType}-date`}
            placeholder="e.g. January 2025"
            value={effectiveDate}
            onChange={(e) => { setEffectiveDate(e.target.value); setHasChanges(true); }}
          />
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground pb-2">
            Last saved: {lastUpdated}
          </p>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        {content.trim() ? (
          <Badge variant="default" className="bg-fun-green text-white">Live — custom content active</Badge>
        ) : (
          <Badge variant="secondary">Using hardcoded default page</Badge>
        )}
      </div>

      {/* HTML Tips */}
      <div className="rounded-2xl border border-border/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          <span>HTML formatting guide</span>
          {showTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showTips && (
          <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground font-mono">
            <span><strong className="text-foreground">&lt;h2&gt;</strong> Section heading</span>
            <span><strong className="text-foreground">&lt;h3&gt;</strong> Sub-heading</span>
            <span><strong className="text-foreground">&lt;p&gt;</strong> Paragraph</span>
            <span><strong className="text-foreground">&lt;strong&gt;</strong> Bold text</span>
            <span><strong className="text-foreground">&lt;ul&gt;&lt;li&gt;</strong> Bullet list</span>
            <span><strong className="text-foreground">&lt;ol&gt;&lt;li&gt;</strong> Numbered list</span>
            <span><strong className="text-foreground">&lt;a href=&quot;...&quot;&gt;</strong> Link</span>
            <span><strong className="text-foreground">&lt;hr&gt;</strong> Divider line</span>
            <span><strong className="text-foreground">&lt;table&gt;</strong> Table</span>
            <span><strong className="text-foreground">&lt;blockquote&gt;</strong> Callout quote</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Label>HTML Content</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2 h-8 text-xs"
        >
          {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {showPreview ? (
        <div
          className="min-h-[400px] rounded-2xl border border-border bg-card p-6 overflow-auto
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-4 [&_h1]:mt-6
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_h2]:mt-6
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mb-2 [&_h3]:mt-4
            [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3
            [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-3 [&_ol]:space-y-1
            [&_li]:text-sm [&_li]:text-muted-foreground [&_li]:leading-relaxed
            [&_strong]:font-semibold [&_strong]:text-foreground
            [&_em]:italic
            [&_a]:text-primary [&_a]:underline
            [&_hr]:border-border [&_hr]:my-5
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-3
            [&_table]:w-full [&_table]:text-sm [&_table]:border [&_table]:border-border [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:mb-4
            [&_th]:px-4 [&_th]:py-2 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-foreground [&_th]:text-left [&_th]:border-b [&_th]:border-border
            [&_td]:px-4 [&_td]:py-2 [&_td]:text-muted-foreground [&_td]:border-t [&_td]:border-border"
          dangerouslySetInnerHTML={{ __html: content || "<p class='text-muted-foreground text-sm italic'>Nothing to preview — add HTML content above.</p>" }}
        />
      ) : (
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setHasChanges(true); }}
          rows={22}
          placeholder={`Paste or write HTML here…\n\nExample:\n<h2>1. Introduction</h2>\n<p>Welcome to ib4me. These terms govern your use of our platform.</p>\n\n<h2>2. Eligibility</h2>\n<ul>\n  <li>You must be at least 18 years old.</li>\n  <li>You must have a valid email address.</li>\n</ul>`}
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {content.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive text-xs"
            onClick={() => {
              if (confirm("Clear this document? The public page will revert to the built-in default.")) {
                setContent("");
                setHasChanges(true);
              }
            }}
          >
            Clear & revert to default
          </Button>
        )}
        <div className="ml-auto">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Document"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LegalDocumentsSettings() {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<{ privacyPolicy: LegalDoc; termsOfService: LegalDoc }>({
    privacyPolicy: {},
    termsOfService: {},
  });

  useEffect(() => {
    fetch("/api/admin/settings?category=legalDocuments")
      .then((r) => r.json())
      .then((json) => {
        if (json.settings) setDocs(json.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading legal documents…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Write or paste HTML content for each legal document. When saved, the public page will display your custom content. Leave blank to show the built-in default page.
      </p>
      <Tabs defaultValue="privacy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            Privacy Policy
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-2">
            <FileText className="h-4 w-4" />
            Terms of Service
          </TabsTrigger>
        </TabsList>
        <TabsContent value="privacy">
          <DocEditor docType="privacyPolicy" initial={docs.privacyPolicy} />
        </TabsContent>
        <TabsContent value="terms">
          <DocEditor docType="termsOfService" initial={docs.termsOfService} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
