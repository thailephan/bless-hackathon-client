# Bless Hackathon Client

A modern, full-featured translation and language enhancement web app built with React, Vite, TypeScript, Tailwind CSS v4, and Redux Toolkit.

## Features

- **Modern UI/UX**: Responsive, accessible, and beautiful interface using Tailwind CSS v4 and Open Sans font.
- **Speech-to-Text**: Record speech, transcribe to text, and use in translation workflows. Microphone permission confirmation and modal UI for recording.
- **Text-to-Speech**: Listen to translations or input text in supported languages.
- **Translation**: Translate between English and Vietnamese (and variants) with automatic API calls on language change.
- **Word Details & Definitions**: Click any word to view its definition, part of speech, meaning, synonyms, antonyms, and IPA pronunciation.
- **Redux Toolkit Caching**: Word details API responses are cached in Redux for fast, offline-friendly lookups.
- **Shortcuts & Accessibility**: Keyboard shortcut modal and accessible components throughout.
- **Radix UI**: Uses Radix UI primitives for dialogs, popovers, tooltips, and more.
- **Mobile Friendly**: Optimized for both desktop and mobile devices.
- **Increased Word Limit**: You can now type or paste up to **500 words** per translation (previously 200).

## Tech Stack

- **React 19** + **Vite**
- **TypeScript**
- **Tailwind CSS v4** (with Open Sans font)
- **Redux Toolkit** for state management
- **Radix UI** for accessible UI primitives
- **Lucide React** for icons

## Project Structure

- `src/` – Main source code for the app
- `src/components/` – UI components (layout, translation, shortcut, UI primitives)
- `src/hooks/` – Custom React hooks
- `src/lib/` – Utility functions and constants
- `src/store/` – Redux store and slices
- `public/` – Static assets and index.html

## Setup & Installation

1. **Clone the repository:**
   ```cmd
   git clone <your-repo-url>
   cd bless-hackathon/client
   ```

2. **Install dependencies (Yarn required):**
   ```cmd
   yarn install
   ```

3. **Start the development server:**
   ```cmd
   yarn dev
   ```
   The app will be available at `http://localhost:5173` by default.

4. **Build for production:**
   ```cmd
   yarn build
   ```

## Related Repositories

- [Bless Function Module](../bless) – Blockless function backend
- [Bless Server](../server) – AI-powered backend APIs

## License

MIT

---

> [GitHub Repository](https://github.com/your-org/bless-hackathon-client)
