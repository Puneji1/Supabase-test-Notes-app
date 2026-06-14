import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, type Note } from "@/lib/supabase.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  ErrorState,
  ErrorStateDescription,
  ErrorStateHeader,
  ErrorStateMedia,
  ErrorStateTitle,
} from "@/components/ui/error-state.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";

const PAGE_SIZE = 10;

type SortDir = "asc" | "desc";

export default function Index() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formValue, setFormValue] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Detail view state
  const [detailNote, setDetailNote] = useState<Note | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("test_notes")
      .select("*")
      .order("id", { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
      toast.error("Failed to fetch notes");
    } else {
      setNotes(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  // Filtered, sorted, paginated data
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = q
      ? notes.filter(
          (n) =>
            n.note.toLowerCase().includes(q) || String(n.id).includes(q),
        )
      : notes;
    return [...base].sort((a, b) =>
      sortDir === "asc" ? a.id - b.id : b.id - a.id,
    );
  }, [notes, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Open create dialog
  const openCreate = () => {
    setEditingNote(null);
    setFormValue("");
    setFormError("");
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEdit = (note: Note) => {
    setEditingNote(note);
    setFormValue(note.note);
    setFormError("");
    setDialogOpen(true);
  };

  // Validate form
  const validate = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Note content is required.";
    if (trimmed.length > 500) return "Note must be 500 characters or fewer.";
    return "";
  };

  // Submit form (create or update)
  const handleSubmit = async () => {
    const err = validate(formValue);
    if (err) {
      setFormError(err);
      return;
    }

    setSubmitting(true);
    const trimmed = formValue.trim();

    if (editingNote) {
      const { error: updateError } = await supabase
        .from("test_notes")
        .update({ note: trimmed })
        .eq("id", editingNote.id);
      if (updateError) {
        toast.error("Failed to update note");
      } else {
        toast.success("Note updated");
        setDialogOpen(false);
        await fetchNotes();
      }
    } else {
      const { error: insertError } = await supabase
        .from("test_notes")
        .insert({ note: trimmed });
      if (insertError) {
        toast.error("Failed to add note");
      } else {
        toast.success("Note added");
        setDialogOpen(false);
        await fetchNotes();
      }
    }
    setSubmitting(false);
  };

  // Delete note
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from("test_notes")
      .delete()
      .eq("id", deleteTarget.id);
    if (deleteError) {
      toast.error("Failed to delete note");
    } else {
      toast.success("Note deleted");
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      if (detailNote?.id === deleteTarget.id) setDetailNote(null);
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  // Error state
  if (error && !loading && notes.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <ErrorState className="max-w-md">
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon" />
            <ErrorStateTitle>Failed to load notes</ErrorStateTitle>
            <ErrorStateDescription>{error}</ErrorStateDescription>
          </ErrorStateHeader>
          <Button onClick={() => void fetchNotes()}>Try again</Button>
        </ErrorState>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <FileText className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Notes</h1>
              <p className="text-xs text-muted-foreground">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                {search && " found"}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add Note</span>
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="gap-1.5"
          >
            <ArrowUpDown className="size-3.5" />
            <span className="hidden sm:inline">
              {sortDir === "asc" ? "Oldest" : "Newest"}
            </span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner className="size-6" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <Empty className="py-24">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>
                {search ? "No notes found" : "No notes yet"}
              </EmptyTitle>
              <EmptyDescription>
                {search
                  ? "Try a different search term."
                  : "Add your first note to get started."}
              </EmptyDescription>
            </EmptyHeader>
            {!search && (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add Note
              </Button>
            )}
          </Empty>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {paged.map((n) => (
                <div
                  key={n.id}
                  className="bg-card border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm break-words flex-1">{n.note}</p>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      #{n.id}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailNote(n)}
                      className="flex-1"
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(n)}
                      className="flex-1"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(n)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="w-[160px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((n) => (
                    <TableRow key={n.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {n.id}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <button
                          onClick={() => setDetailNote(n)}
                          className="text-left hover:text-primary transition-colors cursor-pointer"
                        >
                          <span className="line-clamp-2">{n.note}</span>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDetailNote(n)}
                            title="View details"
                          >
                            <FileText className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(n)}
                            title="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget(n)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}
                  {"\u2013"}
                  {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <Button
                        key={p}
                        variant={p === safePage ? "default" : "outline"}
                        size="icon-sm"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Edit Note" : "Add New Note"}
            </DialogTitle>
            <DialogDescription>
              {editingNote
                ? "Update the note content below."
                : "Enter the note content below."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="note-input">
                Note <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="note-input"
                placeholder="Enter note content..."
                value={formValue}
                onChange={(e) => {
                  setFormValue(e.target.value);
                  if (formError) setFormError("");
                }}
                aria-invalid={!!formError}
                autoFocus
              />
              {formError && (
                <p className="text-xs text-destructive">{formError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formValue.trim().length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting || !formValue.trim()}
            >
              {submitting && <Spinner className="size-4" />}
              {editingNote ? "Save Changes" : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete note #{deleteTarget?.id}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Spinner className="size-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail View Dialog */}
      <Dialog
        open={!!detailNote}
        onOpenChange={(open) => !open && setDetailNote(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Note Details</DialogTitle>
            <DialogDescription>
              Viewing note #{detailNote?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">ID</Label>
              <p className="font-mono text-sm">{detailNote?.id}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Content</Label>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {detailNote?.note}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (detailNote) {
                  setDetailNote(null);
                  openEdit(detailNote);
                }
              }}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (detailNote) {
                  setDetailNote(null);
                  setDeleteTarget(detailNote);
                }
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
