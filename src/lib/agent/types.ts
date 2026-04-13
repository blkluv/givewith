export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type AgentActionType =
  | "search_db"
  | "search_web"
  | "scrape"
  | "donate"
  | "recruit"
  | "check_balance";

export interface AgentAction {
  type: AgentActionType;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: string;
}

export interface ChatSession {
  userId: string;
  messages: ChatMessage[];
  actions: AgentAction[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentContext {
  userId: string;
  userApiKey: string;
  platformApiKey: string;
}
