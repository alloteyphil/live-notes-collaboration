"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TemplateRow = {
  _id: string;
  title: string;
  content: string;
  scope: "global" | "workspace";
  isDefault?: boolean;
};

interface WorkspaceTemplatesPanelProps {
  templates: ReadonlyArray<TemplateRow> | undefined;
  onCreate: (args: { title: string; content: string }) => Promise<void>;
  onUpdate: (args: {
    templateId: Id<"noteTemplates">;
    title: string;
    content: string;
  }) => Promise<void>;
  onDelete: (templateId: Id<"noteTemplates">) => Promise<void>;
}

export function WorkspaceTemplatesPanel({
  templates,
  onCreate,
  onUpdate,
  onDelete,
}: WorkspaceTemplatesPanelProps) {
  const workspaceOnly = useMemo(
    () => (templates ?? []).filter((t) => t.scope === "workspace" && !t.isDefault),
    [templates],
  );

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<Id<"noteTemplates"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const onSubmitNew = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setIsCreating(true);
    try {
      await onCreate({ title, content: newContent });
      setNewTitle("");
      setNewContent("");
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (row: TemplateRow) => {
    setEditingId(row._id as Id<"noteTemplates">);
    setEditTitle(row.title);
    setEditContent(row.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (!title) return;
    setBusyId(editingId);
    try {
      await onUpdate({ templateId: editingId, title, content: editContent });
      cancelEdit();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (templateId: Id<"noteTemplates">) => {
    if (!window.confirm("Delete this template? Notes already created from it are unchanged.")) {
      return;
    }
    setBusyId(templateId);
    try {
      await onDelete(templateId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ContentCard
        title="New workspace template"
        description="Editors can create templates scoped to this workspace only."
      >
        <form onSubmit={(e) => void onSubmitNew(e)} className="space-y-3">
          <Input
            placeholder="Template title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={isCreating}
          />
          <Textarea
            placeholder="Default note body (Markdown supported in the editor preview)"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={6}
            disabled={isCreating}
            className="resize-y"
          />
          <Button type="submit" disabled={isCreating || !newTitle.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Save template
              </>
            )}
          </Button>
        </form>
      </ContentCard>

      <ContentCard
        title="Workspace templates"
        description={`${workspaceOnly.length} saved for this workspace`}
        contentClassName="p-0"
      >
        {templates === undefined ? (
          <div className="p-6 text-sm text-muted-foreground">Loading templates…</div>
        ) : workspaceOnly.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No custom templates yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {workspaceOnly.map((row) => {
              const id = row._id as Id<"noteTemplates">;
              const isEditing = editingId === id;
              const isBusy = busyId === row._id;
              return (
                <li key={row._id} className="px-4 py-4 sm:px-6">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={6}
                        className="resize-y"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={() => void saveEdit()} disabled={isBusy}>
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={cancelEdit} disabled={isBusy}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-card-foreground">{row.title}</p>
                        <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">
                          {row.content}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(row)}
                          disabled={busyId !== null}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void remove(id)}
                          disabled={busyId !== null}
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </ContentCard>
    </div>
  );
}
