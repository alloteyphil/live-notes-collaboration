"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { Bell, CheckCheck } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { NoteDrawer } from "@/components/note/note-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function NotificationsInbox() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [open, setOpen] = useState(false);

  const unreadCount = useQuery(
    api.notifications.unreadCount,
    isAuthenticated && !isLoading ? {} : "skip",
  );

  const {
    results: notifications,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.notifications.listMinePaginated,
    isAuthenticated && !isLoading ? {} : "skip",
    { initialNumItems: 25 },
  );

  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const onOpenItem = useCallback(
    async (notificationId: Id<"notifications">, isRead: boolean) => {
      if (!isRead) {
        try {
          await markRead({ notificationId, isRead: true });
        } catch {
          /* ignore */
        }
      }
      setOpen(false);
    },
    [markRead],
  );

  const onMarkAllRead = useCallback(async () => {
    try {
      await markAllRead({});
    } catch {
      /* ignore */
    }
  }, [markAllRead]);

  if (!isAuthenticated || isLoading) {
    return null;
  }

  const unread = unreadCount ?? 0;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <Badge
            variant="danger"
            className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full p-0 px-1 text-[10px]"
          >
            {unread > 99 ? "99+" : unread}
          </Badge>
        ) : null}
      </Button>

      <NoteDrawer
        usePortal
        open={open}
        onOpenChange={setOpen}
        title="Notifications"
        description="Mentions and activity"
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => void onMarkAllRead()}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          </div>
        }
      >
        <div className="space-y-1 px-4 py-4 sm:px-6">
          {status === "LoadingFirstPage" ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {notifications.map((n) => {
                  const href =
                    n.noteId != null
                      ? n.commentId != null
                        ? `/note/${n.noteId}?comment=${n.commentId}`
                        : `/note/${n.noteId}`
                      : `/workspace/${n.workspaceId}`;
                  return (
                    <li key={n._id}>
                      <Link
                        href={href}
                        onClick={() => void onOpenItem(n._id, n.isRead)}
                        className={cn(
                          "block rounded-lg border border-border p-3 transition-colors hover:bg-accent/50",
                          !n.isRead ? "border-primary/30 bg-primary/5" : "bg-card",
                        )}
                      >
                        <p className="text-sm font-medium text-card-foreground">{n.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {status === "CanLoadMore" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => loadMore(20)}
                >
                  Load more
                </Button>
              ) : null}
            </>
          )}
        </div>
      </NoteDrawer>
    </>
  );
}
