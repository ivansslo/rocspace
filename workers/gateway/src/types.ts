// workers/gateway/src/types.ts
// Proper TypeScript source (reconstructed from bundle for development)

export const COMPONENTS = [
  { id: "chat", name: "Chat-Live", desc: "Multi-model AI chat with Clerk auth, streaming, CrewAI, Crawl4AI." },
  { id: "crew", name: "CrewAI", desc: "Multi-agent orchestration (Researcher → Analyst → Writer)." },
  { id: "crawl", name: "Crawl4AI", desc: "URL → clean markdown, extract structured data." },
  { id: "dashboard", name: "Dashboard", desc: "Realtime infrastructure dashboard." },
  { id: "zapier", name: "Zapier", desc: "Clerk → Zapier → Solace integration." },
  { id: "logs", name: "Logs", desc: "Activity logs for Crawl4AI, Chat, Zapier, CrewAI." },
  { id: "solace", name: "Solace", desc: "Event mesh connected, Singapore cluster." },
  { id: "clerk", name: "Clerk Auth", desc: "8 social logins, profile management." },
  { id: "cfai", name: "CF AI", desc: "60 Cloudflare AI models." },
  { id: "notion", name: "Notion/ClawLink", desc: "45 tools via ClawLink." },
  { id: "honcho", name: "Honcho", desc: "Memory-aware AI chat." },
  { id: "tailscale", name: "Tailscale", desc: "VPN mesh network." },
  { id: "links", name: "Links Hub", desc: "Apps, tools, skills directory." }
];

export const VERSION = "17.1.1";

export interface Env {
  TOKEN?: string;
  GATEWAY_TOKEN?: string;
  GROQ_KEY?: string;
  OR_KEY?: string;
  GEMINI_KEY?: string;
  OPENAI_KEY?: string;
  CLERK_PK?: string;
  CLERK_SK?: string;
  SOLACE_URL?: string;
  SOLACE_USER?: string;
  SOLACE_PASS?: string;
  SOLACE_API_TOKEN?: string;
  SOLACE_SEMP_URL?: string;
  SOLACE_VIEW_USER?: string;
  SOLACE_VIEW_PASS?: string;
  FIREBASE_CONFIG?: string;
  LOGS?: { put: (key: string, val: string, opts?: any) => Promise<any> };
  DB?: { prepare: (sql: string) => any };
  // add more as needed
}
