"use client";

import { CheckCircle2, MessageSquare } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NoteDrawer } from "@/components/note/note-drawer";
import { cn } from "@/lib/utils";

type Comment = {
  _id: Id<"noteComments">;
  content: string;
  status: string;
  authorDisplayName: string;
  authorEmail: string | null;
  mentionEmails: string[];
  createdAt: number;
};

interface CommentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: ReadonlyArray<Comment> | undefined;
  canComment: boolean;
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onToggleResolve: (commentId: Id<"noteComments">, resolved: boolean) => void;
}

export function CommentsDrawer({
  open,
  onOpenChange,
  comments,
  canComment,
  commentDraft,
  onCommentDraftChange,
  isSubmitting,
  onSubmit,
  onToggleResolve,
}: CommentsDrawerProps) {
  const unresolved = comments?.filter((c) => c.status !== "resolved") ?? [];
  const resolved = comments?.filter((c) => c.status === "resolved") ?? [];

  return (
    <NoteDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Comments"
      description={
        comments === undefined
          ? "Loading..."
          : `${unresolved.length} open \u00B7 ${resolved.length} resolved`
      }
      footer={
        canComment ? (
          <div className="space-y-2">
            <Textarea
              value={commentDraft}
              onChange={(event) => onCommentDraftChange(event.target.value)}
              placeholder="Add a comment. Mention teammates with @email.com"
              rows={3}
              disabled={isSubmitting}
              className="resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                onClick={onSubmit}
                disabled={isSubmitting || !commentDraft.trim()}
              >
                {isSubmitting ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sign in to join the conversation.
          </p>
        )
      }
    >
      <div className="space-y-4 px-4 py-4 sm:px-6">
        {comments === undefined ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-card-foreground">No comments yet</p>
            <p className="text-xs text-muted-foreground">
              Start the conversation by adding the first comment.
            </p>
          </div>
        ) : (
          <>
            {unresolved.length > 0 ? (
              <CommentGroup
                label="Open"
                comments={unresolved}
                onToggleResolve={onToggleResolve}
              />
            ) : null}
            {resolved.length > 0 ? (
              <CommentGroup
                label="Resolved"
                comments={resolved}
                onToggleResolve={onToggleResolve}
                muted
              />
            ) : null}
          </>
        )}
      </div>
    </NoteDrawer>
  );
}

interface CommentGroupProps {
  label: string;
  comments: ReadonlyArray<Comment>;
  onToggleResolve: (commentId: Id<"noteComments">, resolved: boolean) => void;
  muted?: boolean;
}

function CommentGroup({ label, comments, onToggleResolve, muted }: CommentGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="space-y-2">
        {comments.map((comment) => {
          const isResolved = comment.status === "resolved";
          return (
            <div
              key={comment._id}
              className={cn(
                "rounded-md border border-border p-3 text-sm",
                muted ? "bg-muted/30" : "bg-background",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {comment.authorDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-card-foreground">
                      {comment.authorDisplayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => onToggleResolve(comment._id, isResolved)}
                >
                  {isResolved ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Reopen
                    </>
                  ) : (
                    "Resolve"
                  )}
                </Button>
              </div>
              <p className={cn("whitespace-pre-wrap text-sm", muted ? "text-muted-foreground" : "text-card-foreground")}>
                {comment.content}
              </p>
              {comment.mentionEmails.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Mentions: {comment.mentionEmails.join(", ")}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
