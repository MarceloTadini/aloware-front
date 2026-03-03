import { useEffect, useState } from 'react';
import { getConfig, patchConfig } from '../api';
import type { AgentConfig, Tool } from '../api';
import TestCallWidget from './TestCallWidget';

const VOICE_OPTIONS = [
  { label: 'Puck (default)', value: 'Puck' },
  { label: 'Charon', value: 'Charon' },
  { label: 'Kore', value: 'Kore' },
  { label: 'Fenrir', value: 'Fenrir' },
  { label: 'Aoede', value: 'Aoede' },
  { label: 'Custom…', value: '__custom__' },
];

const ALL_TOOLS: { key: Tool; label: string; description: string }[] = [
  {
    key: 'check_availability',
    label: 'Check Availability',
    description: 'Returns open appointment slots for a given date.',
  },
  {
    key: 'book_appointment',
    label: 'Book Appointment',
    description: 'Logs and confirms an appointment booking.',
  },
  {
    key: 'transfer_to_human',
    label: 'Transfer to Human',
    description: 'Transfers the call to a live agent.',
  },
];

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

let toastCounter = 0;

export default function AdminDashboard() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [voiceSelect, setVoiceSelect] = useState(VOICE_OPTIONS[0].value);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(type: ToastType, message: string) {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  useEffect(() => {
    getConfig()
      .then((data) => {
        setConfig(data);
        const known = VOICE_OPTIONS.find((o) => o.value === data.voice_id);
        if (known && known.value !== '__custom__') {
          setVoiceSelect(data.voice_id);
        } else {
          setVoiceSelect('__custom__');
          setCustomVoiceId(data.voice_id);
        }
      })
      .catch(() => addToast('error', 'Could not load config from backend.'))
      .finally(() => setLoading(false));
  }, []);

  function setField<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function toggleTool(tool: Tool) {
    if (!config) return;
    const has = config.enabled_tools.includes(tool);
    setField(
      'enabled_tools',
      has ? config.enabled_tools.filter((t) => t !== tool) : [...config.enabled_tools, tool],
    );
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    const payload: AgentConfig = {
      ...config,
      voice_id: voiceSelect === '__custom__' ? customVoiceId : voiceSelect,
    };
    try {
      const updated = await patchConfig(payload);
      setConfig(updated);
      addToast('success', 'Configuration saved successfully.');
    } catch {
      addToast('error', 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <span className="text-lg font-semibold tracking-tight text-white">Aloware Health</span>
          <p className="text-xs text-gray-400 mt-0.5">Voice Agent Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarLink active>Agent Settings</SidebarLink>
          <SidebarLink>Tools</SidebarLink>
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <TestCallWidget />
        </div>
        <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
          Backend: localhost:8000
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Agent Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving || loading || !config}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Loading configuration…
          </div>
        ) : !config ? (
          <div className="flex items-center justify-center h-64 text-red-400">
            Failed to load configuration. Is the backend running?
          </div>
        ) : (
          <div className="px-8 py-8 max-w-3xl space-y-8">
            {/* General Settings */}
            <Section title="General" description="Basic identity of the voice agent.">
              <Field label="Agent Name">
                <input
                  type="text"
                  value={config.agent_name}
                  onChange={(e) => setField('agent_name', e.target.value)}
                  className="input"
                  placeholder="Ana"
                />
              </Field>

              <Field label="Voice Persona">
                <select
                  value={voiceSelect}
                  onChange={(e) => setVoiceSelect(e.target.value)}
                  className="input"
                >
                  {VOICE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {voiceSelect === '__custom__' && (
                  <input
                    type="text"
                    value={customVoiceId}
                    onChange={(e) => setCustomVoiceId(e.target.value)}
                    className="input mt-2"
                    placeholder="Gemini voice name"
                  />
                )}
              </Field>

              <Field label="Greeting" hint="First sentence spoken to every caller.">
                <input
                  type="text"
                  value={config.greeting}
                  onChange={(e) => setField('greeting', e.target.value)}
                  className="input"
                  placeholder="Hello! How can I help you today?"
                />
              </Field>
            </Section>

            {/* System Prompt */}
            <Section
              title="System Prompt"
              description="Full LLM instructions, including guardrails."
            >
              <textarea
                value={config.system_prompt}
                onChange={(e) => setField('system_prompt', e.target.value)}
                rows={12}
                className="input font-mono text-sm resize-y"
                placeholder="You are Ana, a medical receptionist…"
              />
            </Section>

            {/* Tools */}
            <Section
              title="Enabled Tools"
              description="Tools available to the LLM during a call. Disable a tool to hide it entirely."
            >
              <div className="space-y-3">
                {ALL_TOOLS.map((tool) => (
                  <label
                    key={tool.key}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={config.enabled_tools.includes(tool.key)}
                      onChange={() => toggleTool(tool.key)}
                      className="mt-0.5 h-4 w-4 rounded accent-indigo-500 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-100">{tool.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tool.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Section>
          </div>
        )}
      </main>

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
              t.type === 'success'
                ? 'bg-emerald-700 text-emerald-50'
                : 'bg-red-700 text-red-50'
            }`}
          >
            {t.type === 'success' ? '✓' : '✕'} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarLink({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? 'bg-gray-800 text-white font-medium'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
        {hint && <span className="ml-1.5 text-xs text-gray-500 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
