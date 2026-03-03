# BASED ON MY BACKEND, THAT YOU HAVE IN OU MEMORY LET'S IMPLEMENT MY FRONT END, THEY MUST BE INTEGRATED

# Project Context: Admin UI (React)
You must build the management interface for the voice agent. The focus is functionality and speed, not visual design.

## Technical Requirements
- **Framework:** Framework: React (Vite) + Tailwind CSS (for speed).
- **State Management** : Simple useState or React Query.

## UI Features
1. **General Settings Panel:**
   - Input for `Agent Name`.
   - Select for `Voice Persona` (opções: Alloy, Echo, Shimmer ou IDs da ElevenLabs).
   - Large textarea for `System Prompt / Instructions`.
   - Text input for `Greeting`  (initial message).

2. **Tools Management:**
   - A list of checkboxes to enable/disable the tools: `Check Availability`, `Book Appointment`, `Transfer Call`.

3. **Save Button:**
   - Must triggez a PUT/POST request to the local backend (FastAPI) to update the agent configuration file.

4. **Test Widget (Optional but recommended)**
   - Integrate the LiveKit VoiceVisualizer component or a simple "Start Call" button to test the agent directly from the browser using the microphone.

## Visual Style
- Use a simple "Dashboard" layout: Sidebar with links and a central area containing the form.
- Visual feedback (Toast or Alert) when the configuration is successfully saved.

## Expected Output
- Standard Vite folder structure.
- `AdminDashboard.tsx` Component.
- `api.ts` Service  for communication with the Python backend.



