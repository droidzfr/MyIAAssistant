# Technical Guide - My IA Assistant

This document describes the technical architecture, project structure, and design choices for the "My IA Assistant" Chrome extension.

## Table of Contents

- [Technical Guide - My IA Assistant](#technical-guide---my-ia-assistant)
  - [Table of Contents](#table-of-contents)
  - [1. Introduction](#1-introduction)
    - [Technical Objectives](#technical-objectives)
    - [Technology Choices](#technology-choices)
  - [2. Project Structure](#2-project-structure)
  - [3. Architecture and Data Flow](#3-architecture-and-data-flow)
    - [Manifest V3](#manifest-v3)
    - [Service Worker (background.js)](#service-worker-backgroundjs)
    - [Interaction with Web Pages](#interaction-with-web-pages)
    - [Popup (popup/)](#popup-popup)
    - [Options Page (options/)](#options-page-options)
    - [Inter-Component Communication](#inter-component-communication)
  - [4. Data Management](#4-data-management)
    - [Storage (chrome.storage)](#storage-chromestorage)
  - [5. Internationalisation](#5-internationalisation)
  - [6. Interaction with AI APIs](#6-interaction-with-ai-apis)
    - [Request Flow](#request-flow)
    - [API Key Management](#api-key-management)
  - [7. Development and Contribution](#7-development-and-contribution)
    - [Development Installation](#development-installation)
    - [Potential Improvement Areas](#potential-improvement-areas)

---

## 1. Introduction

### Technical Objectives

*   **Modularity**: A well-organized architecture for easy maintenance and feature extension.
*   **Manifest V3 Compliance**: Using the latest standard for Chrome extensions to ensure future compatibility.
*   **Secure API Key Management**: API keys are stored locally and never pass through third-party servers.
*   **Responsive UI**: Using Bootstrap 5 for a consistent and adaptive interface.

### Technology Choices

*   **JavaScript (Vanilla JS):** Chosen for its lightness and direct integration with Chrome APIs. No heavy framework was deemed necessary for the current complexity.
*   **Bootstrap 5:** Used for rapid, responsive, and consistent layout between the popup and options.
*   **Manifest V3:** Required for new Chrome extensions, involves using a Service Worker instead of persistent background pages and changes in APIs (e.g., `chrome.scripting`).
*   **`chrome.storage` (local/sync):** For persisting user data (agents, providers, settings).
*   **`chrome.runtime.sendMessage` / `onMessage`:** For communication between the popup and the service worker.
*   **`fetch` API:** For calls to external AI APIs from the service worker.

## 2. Project Structure

```
/
|-- _locales/          (Internationalization files)
|   |-- en/           (English translations)
|   |-- fr/           (French translations, if available)
|-- docs/
|   |-- user_guide.md  (User guide)
|   |-- technical_guide.md (Technical guide)
|-- icons/            (Extension icons)
|   |-- icon16.png
|   |-- icon48.png
|   |-- icon128.png
|-- js/
|   |-- api.js        (Handles API calls to AI providers)
|   |-- background.js  (Service Worker)
|   |-- storage.js     (Data storage management)
|-- libs/              (Local dependencies)
|   |-- bootstrap/     (CSS Framework)
|-- options/           (Extension options page)
|   |-- handlers.js    (Event handlers)
|   |-- importExport.js (Import/export functions)
|   |-- localization.js (Localization support)
|   |-- options.html   (HTML structure)
|   |-- options.css    (CSS styles)
|   |-- options.js     (JavaScript entry point)
|   |-- ui.js          (User interface functions)
|-- popup/             (Extension popup)
|   |-- popup.html     (HTML structure)
|   |-- popup.css      (CSS styles)
|   |-- popup.js       (JavaScript logic)
|-- manifest.json      (Extension descriptor)
|-- README.md         (Main documentation)
```

This structure logically organizes the code by separating the different parts of the extension: the user interface (popup and options), business logic (js), resources (icons, libs), and documentation (docs, README.md).

## 3. Architecture and Data Flow

### Manifest V3

*   **Non-persistent Service Worker**: Unlike Manifest V2, the background script is no longer persistent but runs as an on-demand Service Worker.
*   **`chrome.scripting` API**: Used to inject code into web pages instead of using permanent content scripts.
*   **Execution Restrictions**: Injected scripts have limitations for security reasons.
*   **Event-driven Model**: The Service Worker can be started by events like alarms or messages, then goes dormant when not in use.

### Service Worker (background.js)

*   Central non-UI point of the extension.
*   Manages installation (context menu creation).
*   Listens for context menu clicks:
    *   Retrieves selected text (via `info.selectionText`) or injects `getPageText` via `chrome.scripting` to get page text.
    *   Stores the text in `chrome.storage.session`.
    *   Does nothing else (user must click the icon).
*   Listens for messages from the popup (`chrome.runtime.onMessage`):
    *   Processes `queryAgent` requests.
    *   Retrieves agent/provider data from `chrome.storage` (local or sync).
    *   Builds and executes the `fetch` call to the AI API.
    *   Returns the response or error to the popup via `sendResponse`.

### Interaction with Web Pages

*   Interaction with web pages is handled directly by the service worker (`background.js`) via the `chrome.scripting` API.
*   The service worker retrieves the selected text via `info.selectionText` or injects JavaScript code into the current page to get all the text if necessary.
*   This approach eliminates the need for a dedicated content script, thus simplifying the extension's architecture.

### Popup (popup/)

*   Main user interface for quick interaction.
*   On load (`DOMContentLoaded`):
    *   Applies the theme (light/dark) read from settings.
    *   Attempts to read text from `chrome.storage.session` (coming from right-click).
    *   Loads the previous state (entered text, response) from `localStorage`.
    *   Loads the agent list from `chrome.storage` (local or sync).
    *   Attempts to preselect the last used agent (from `localStorage`).
*   Allows agent selection.
*   Sends the request (`agentId`, `text`) to the service worker via `chrome.runtime.sendMessage` when "Query" is clicked.
*   Displays the response (or error) received from the service worker.
*   Manages Copy, Clear, Options buttons.
*   Saves the state (entered text, response) in `localStorage` on changes or after receiving response/error.

### Options Page (options/)

*   Interface for full configuration.
*   Uses Bootstrap tabs to separate sections (Agents, Providers, Settings, Import/Export).
*   Logic primarily in `options.js`.
*   Reads and writes configurations (agents, providers, settings) to `chrome.storage` (local or sync, depending on the `useSync` setting).
*   Uses Bootstrap Modals for add/edit forms.
*   Manages global configuration import/export in JSON.
*   Applies dark mode to the options page itself.

### Inter-Component Communication

*   **Context Menu -> Background:** Via `chrome.contextMenus.onClicked`.
*   **Background -> Page (for text):** Via `chrome.scripting.executeScript`.
*   **Background -> Popup (for initial text):** Via `chrome.storage.session`.
*   **Popup -> Background (for API request):** Via `chrome.runtime.sendMessage`.
*   **Background -> Popup (for API response):** Via `sendResponse` (`onMessage` callback).
*   **Options -> Storage:** Via `chrome.storage.local` / `chrome.storage.sync`.
*   **Popup -> Storage:** Via `chrome.storage` (to read agents/settings) and `localStorage` (for UI state).

## 4. Data Management

### Storage (chrome.storage)

*   **`chrome.storage.local`:** Used by default for agents and providers. **Always** used for settings (`myIAAssistantSettings`) because the extension needs to know where to look for other data.
*   **`chrome.storage.sync`:** Used for agents and providers if the `useSync` option is enabled in settings. Be mindful of `sync` quotas.
*   **`chrome.storage.session`:** Used only to pass the selected text from the context menu to the popup when it opens. Cleared after reading.
*   **`localStorage` (Popup):** Used to persist the popup's UI state (entered text, displayed response, last selected agent) between popup openings.

## 5. Internationalization

*   **Structure**: The `_locales` folder contains translation files organized by language code (en, fr, etc.).
*   **Message Files**: Each language folder contains a `messages.json` file with key-value pairs for each string to be translated.
*   **Usage in Code**:
    *   In HTML: Via `data-i18n` attributes that are processed by the `localizeHtml()` function.
    *   In JavaScript: Via `chrome.i18n.getMessage("messageKey")` or `localization.getMessage("messageKey")`.
*   **Language Configuration**: The user can choose the language in the settings; otherwise, the extension uses the browser's language ('auto').

## 6. Interaction with AI APIs

### Request Flow

1.  Popup sends `{ type: "queryAgent", payload: { agentId, text } }` to background.
2.  Background retrieves corresponding agent and provider from storage.
3.  Background builds the `requestBody` (messages, model, parameters prioritizing agent > provider).
4.  Background performs the `fetch` POST call to the provider's endpoint with `Authorization: Bearer <apiKey>`.
5.  Background parses the JSON response.
6.  Background extracts the response content (e.g., `data.choices[0].message.content`).
7.  Background returns `{ success: true, data: ... }` or `{ success: false, error: ... }` to the popup via `sendResponse`.

### API Key Management

*   API keys are stored in `chrome.storage` (local or sync).
*   They are only read by the service worker (`background.js`) just before the `fetch` call.
*   They are transmitted directly to the external API via the `Authorization` header. They do not pass through any intermediary servers.

## 7. Development and Contribution

### Development Installation

1.  Clone or download this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" in the top right corner.
4.  Click "Load unpacked".
5.  Select the root project folder (the folder containing `manifest.json`).
6.  The "My IA Assistant" extension should now appear in your extensions list and its icon in the toolbar.
