import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
}

export async function saveMessage(sessionId: string, message: ChatMessage): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("chat_conversations").insert({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      metadata: message.metadata ?? {},
    });
    if (error) {
      console.warn("Error saving chat memory:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception saving chat memory:", err);
    return false;
  }
}

export async function getHistory(sessionId: string, limit = 10): Promise<ChatMessage[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("role, content, metadata")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Error loading chat history:", error.message);
      return [];
    }
    return (data ?? []).reverse().map((row) => ({
      role: row.role as "user" | "assistant" | "system",
      content: row.content,
      metadata: row.metadata ?? {},
    }));
  } catch (err) {
    console.warn("Exception loading chat history:", err);
    return [];
  }
}

export function formatHistoryForLLM(history: ChatMessage[]): {
  role: string;
  content: string;
}[] {
  return history
    .filter((m) => m.role !== "system")
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content }));
}
