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

## Tech Stack

- **React 19** + **Vite**
- **TypeScript**
- **Tailwind CSS v4** (with Open Sans font)
- **Redux Toolkit** for state management
- **Radix UI** for accessible UI primitives
- **Lucide React** for icons

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

5. **Preview production build:**
   ```cmd
   yarn preview
   ```

## How to Use

- Enter or record text in the source panel.
- Select source and target languages.
- Click the mic button to start speech-to-text (first click requests permission, second opens modal).
- Click any word for details/definitions.
- Use the shortcut modal for keyboard help.

## License

This project is for hackathon/demo purposes. For any production or open-source use, please add your own license file.

## Credits
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Google Fonts - Open Sans](https://fonts.google.com/specimen/Open+Sans)

---

For backend/server setup, see the `../server` directory.
