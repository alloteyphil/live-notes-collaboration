"use client";

import { forwardRef, useEffect, useState, type Ref } from "react";
import ReactMarkdown from "react-markdown";
import { Clock, Eye, Lock, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface NoteEditorSurfaceProps {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string, selectionStart: number) => void;
  onBlur: () => void;
  onCursorPositionChange: (position: number) => void;
  canEditThisNote: boolean;
  isArchived: boolean;
  typingLabel: string;
  effectiveLastSavedAt: number | null;
  hasUnsavedChanges: boolean;
  saveStatus: "idle" | "typing" | "saving" | "saved" | "error";
  onRetrySave: () => void;
  /** Ref for the title input (e.g. jump-to-match from search). */
  titleInputRef?: Ref<HTMLInputElement>;
  /** When this number changes, switches body tab to Write so the textarea can be focused. */
  forceWriteTabToken?: number;
}

export const NoteEditorSurface = forwardRef<HTMLTextAreaElement, NoteEditorSurfaceProps>(
  (
    {
      title,
      content,
      onTitleChange,
      onContentChange,
      onBlur,
      onCursorPositionChange,
      canEditThisNote,
      isArchived,
      typingLabel,
      effectiveLastSavedAt,
      hasUnsavedChanges,
      saveStatus,
      onRetrySave,
      titleInputRef,
      forceWriteTabToken = 0,
    },
    ref,
  ) => {
    const [bodyTab, setBodyTab] = useState<"write" | "preview">("write");
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const charCount = content.length;

    useEffect(() => {
      if (forceWriteTabToken <= 0) return;
      queueMicrotask(() => {
        setBodyTab("write");
      });
    }, [forceWriteTabToken]);

    return (
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div
          className={cn(
            "flex min-h-5 items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground transition-opacity sm:px-8",
            typingLabel ? "opacity-100" : "opacity-0",
          )}
          aria-live="polite"
        >
          <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span>{typingLabel || "\u00A0"}</span>
        </div>

        <div className="space-y-3 px-4 pt-6 pb-4 sm:px-8 sm:pt-8">
          <Input
            ref={titleInputRef}
            value={title}
            onChange={(event) => {
              if (!canEditThisNote) return;
              onTitleChange(event.target.value);
            }}
            onBlur={onBlur}
            placeholder="Untitled note"
            disabled={!canEditThisNote}
            className={cn(
              "h-auto border-0 bg-transparent p-0 text-3xl font-semibold leading-tight tracking-tight placeholder:text-muted-foreground/40 focus-visible:ring-0 sm:text-4xl",
              !canEditThisNote ? "cursor-not-allowed opacity-80" : undefined,
            )}
          />
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {effectiveLastSavedAt
                ? `Last edited ${new Date(effectiveLastSavedAt).toLocaleTimeString()}`
                : "Not saved yet"}
            </span>
            {isArchived ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 font-medium text-warning">
                Archived
              </span>
            ) : null}
            {!canEditThisNote ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
                Read only
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 border-b border-border px-4 py-2 sm:px-8">
          <Button
            type="button"
            variant={bodyTab === "write" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setBodyTab("write")}
          >
            <Pencil className="h-3.5 w-3.5" />
            Write
          </Button>
          <Button
            type="button"
            variant={bodyTab === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setBodyTab("preview")}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        </div>

        <div className="px-4 pb-6 sm:px-8">
          {bodyTab === "write" ? (
            <Textarea
              ref={ref}
              value={content}
              onChange={(event) => {
                if (!canEditThisNote) return;
                onContentChange(event.target.value, event.target.selectionStart);
              }}
              onBlur={onBlur}
              onClick={(event) => onCursorPositionChange(event.currentTarget.selectionStart)}
              onKeyUp={(event) => onCursorPositionChange(event.currentTarget.selectionStart)}
              onSelect={(event) => onCursorPositionChange(event.currentTarget.selectionStart)}
              placeholder="Start writing (Markdown supported in preview)..."
              disabled={!canEditThisNote}
              className={cn(
                "min-h-[calc(100vh-22rem)] resize-none border-0 bg-transparent p-0 text-base leading-relaxed placeholder:text-muted-foreground/40 focus-visible:ring-0",
                !canEditThisNote ? "cursor-not-allowed opacity-80" : undefined,
              )}
            />
          ) : (
            <div className="markdown-preview min-h-[calc(100vh-22rem)] py-1 text-base leading-relaxed">
              {content.trim() ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span>{wordCount} words</span>
            <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
            <span>{charCount} characters</span>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === "error" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetrySave}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Retry save
              </Button>
            ) : null}
            {saveStatus === "saved" && !hasUnsavedChanges ? (
              <span className="text-success">All changes saved</span>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);

NoteEditorSurface.displayName = "NoteEditorSurface";
