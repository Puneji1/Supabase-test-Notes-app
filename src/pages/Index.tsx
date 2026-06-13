import { useEffect, useState } from "react";
import { supabase, type Note } from "@/lib/supabase.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function Index() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("test_notes")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      toast.error("Failed to fetch notes");
    } else {
      setNotes(data ?? []);
    }
  };

  useEffect(() => {
    void fetchNotes();
  }, []);

  const addNote = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setLoading(true);
    const { error } = await supabase.from("test_notes").insert({ note: trimmed });
    if (error) {
      toast.error("Failed to add note");
    } else {
      setInput("");
      await fetchNotes();
      toast.success("Note added");
    }
    setLoading(false);
  };

  const deleteNote = async (id: number) => {
    const { error } = await supabase.from("test_notes").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete note");
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-3xl font-bold text-center tracking-tight">Test Notes</h1>

        <div className="flex gap-2">
          <Input
            placeholder="Type a note..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void addNote()}
          />
          <Button onClick={() => void addNote()} disabled={loading || !input.trim()}>
            Add
          </Button>
        </div>

        <ul className="space-y-2">
          {notes.length === 0 && (
            <li className="text-center text-muted-foreground text-sm py-8">
              No notes yet. Add one above.
            </li>
          )}
          {notes.map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between bg-card border rounded-lg px-4 py-3"
            >
              <span className="text-sm break-all">{n.note}</span>
              <button
                onClick={() => void deleteNote(n.id)}
                className="ml-3 text-muted-foreground hover:text-destructive cursor-pointer shrink-0 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
