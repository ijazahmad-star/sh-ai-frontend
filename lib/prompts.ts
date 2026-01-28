import type { Prompt } from "@/types/prompt";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export const fetchAllSystemPrompts = async (
  userId: string,
): Promise<{
  prompts: Prompt[];
} | null> => {
  try {
    const res = await fetch(
      `${API_BASE}/get_prompts/${encodeURIComponent(userId)}`,
    );
    if (!res.ok) {
      console.error("fetchAllSystemPrompts: non-ok response", res.status);
      return { prompts: [] };
    }
    const data = await res.json();
    if (Array.isArray(data)) return { prompts: data };
    if (data && Array.isArray(data.prompts)) return { prompts: data.prompts };
    return { prompts: [] };
  } catch (e) {
    console.error("fetchAllSystemPrompts:", e);
    return null;
  }
};

export const deleteSystemPrompt = async (
  name: string,
  userId: string,
): Promise<boolean> => {
  try {
    const res = await fetch(
      `${API_BASE}/delete_prompt/${encodeURIComponent(userId)}/${encodeURIComponent(name)}`,
      {
        method: "DELETE",
      },
    );
    return res.ok;
  } catch (e) {
    console.error("deleteSystemPrompt:", e);
    return false;
  }
};

export const setActiveSystemPrompt = async (
  name: string,
  userId: string,
): Promise<boolean> => {
  try {
    const res = await fetch(
      `${API_BASE}/set_active_prompt/${encodeURIComponent(userId)}/${encodeURIComponent(name)}`,
      {
        method: "POST",
      },
    );
    return res.ok;
  } catch (e) {
    console.error("setActiveSystemPrompt:", e);
    return false;
  }
};

export const addSystemPrompt = async (
  prompt_name: string,
  prompt_text: string,
  userId: string,
): Promise<Prompt | null> => {
  try {
    const res = await fetch(`${API_BASE}/add_prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: prompt_name,
        prompt: prompt_text,
        user_id: userId,
      }),
    });

    if (!res.ok) {
      console.error("Failed to add prompt", res.status);
      return null;
    }
    const body = await res.json();
    // Return the result from the response
    return body.result as Prompt;
  } catch (e) {
    console.error("addSystemPrompt:", e);
    return null;
  }
};

export const updateSystemPrompt = async (
  oldName: string,
  newPrompt: string,
  userId: string,
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/edit_prompt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_name: oldName,
        new_prompt: newPrompt,
        user_id: userId,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("updateSystemPrompt:", e);
    return false;
  }
};

export const getActivePrompt = async (
  userId: string,
): Promise<Prompt | null> => {
  try {
    const res = await fetch(
      `${API_BASE}/get_active_prompt/${encodeURIComponent(userId)}`,
    );
    if (!res.ok) {
      console.error("getActivePrompt: non-ok response", res.status);
      return null;
    }
    const data = await res.json();
    return data as Prompt;
  } catch (e) {
    console.error("getActivePrompt:", e);
    return null;
  }
};

export const getAiResponse = async (
  query: string,
  userId: string,
  kbType: "default" | "custom" = "default",
  conversationId: string,
  model: string = "gpt-4o-mini",
): Promise<{
  response: string;
  sources: any[];
  message_id?: string;
} | null> => {
  try {
    const res = await fetch(`${API_BASE}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        user_id: userId,
        kb_type: kbType,
        conversation_id: conversationId,
        model: model,
      }),
    });

    if (!res.ok) {
      console.error("Failed to get AI response", res.status);
      return null;
    }
    const body = await res.json();
    return {
      response: body.response || "",
      sources: body.sources || [],
      message_id: body.message_id,
    };
  } catch (e) {
    console.error("getAiResponse:", e);
    return null;
  }
};

export const generatePrompt = async (
  requirements: string,
  userId: string,
): Promise<{
  status: string;
  generated_prompt: string;
  user_id: string;
} | null> => {
  try {
    const res = await fetch(`${API_BASE}/generate_prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirements: requirements,
        user_id: userId,
      }),
    });

    if (!res.ok) {
      console.error("Failed to generate prompt", res.status);
      return null;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("generatePrompt:", e);
    return null;
  }
};

// uploadFile function removed - upload is now handled in Knowledge Base page
