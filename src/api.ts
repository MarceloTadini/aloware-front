const BASE_URL = 'http://localhost:8000';

export type Tool = 'check_availability' | 'book_appointment' | 'transfer_to_human';

export interface AgentConfig {
  agent_name: string;
  greeting: string;
  voice_id: string;
  system_prompt: string;
  enabled_tools: Tool[];
}

export async function getConfig(): Promise<AgentConfig> {
  const res = await fetch(`${BASE_URL}/config`);
  if (!res.ok) throw new Error(`GET /config failed: ${res.status}`);
  return res.json();
}

export async function patchConfig(data: Partial<AgentConfig>): Promise<AgentConfig> {
  const res = await fetch(`${BASE_URL}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH /config failed: ${res.status}`);
  const json = await res.json();
  return json.config;
}

export interface TokenResponse {
  token: string;
  url: string;
}

export async function getToken(room = 'test-room', identity = 'admin'): Promise<TokenResponse> {
  const params = new URLSearchParams({ room, identity });
  const res = await fetch(`${BASE_URL}/token?${params}`);
  if (!res.ok) throw new Error(`GET /token failed: ${res.status}`);
  return res.json();
}
