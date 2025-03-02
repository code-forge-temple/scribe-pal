# ScribePal

ScribePal is an Open Source intelligent browser extension that leverages AI to empower your web experience by providing contextual insights, efficient content summarization, and seamless interaction while you browse.

## Table of Contents

<!-- TOC -->

- [ScribePal](#scribepal)
    - [Table of Contents](#table-of-contents)
    - [Privacy](#privacy)
    - [Compatibility](#compatibility)
    - [Features](#features)
    - [Prerequisites](#prerequisites)
        - [Linux](#linux)
        - [Windows](#windows)
    - [Development](#development)
        - [Installation](#installation)
        - [Building](#building)
            - [I. For development:](#i-for-development)
            - [II. For production:](#ii-for-production)
        - [Linting](#linting)
        - [Installing](#installing)
    - [Usage](#usage)
    - [License](#license)

<!-- /TOC -->

## Privacy

ScribePal works with local Ollama models, ensuring that all AI processing and messaging is conducted within your local network. Your private data remains on your system and is never transmitted to external servers. This design provides you with full control over your information and guarantees that nobody outside your network has access to your data.

## Compatibility

It is compatible with all Chromium and Gecko-based browsers: Chrome, Vivaldi, Opera, Edge, Firefox, Brave etc.

## Features

- **AI-powered assistance:** Communicates with an AI service (using [ollama](https://www.npmjs.com/package/ollama)) to generate responses.
- **It is PRIVATE:** Because it communicates with a local (within your LAN) Ollama service and LLMs, all your information stays private.
- **Theming:** Supports light and dark themes.
- **Chat Interface:** A draggable chat box for sending and receiving messages.
- **Model Management:** Select, refresh, download, and delete models.
- **Capture Tool:** Highlight HTML elements to capture text for the chat input.
- **Prompt Customization:** Adjust and customize prompts to instruct the AI model on how to generate responses.

## Prerequisites

Before installing ScribePal, ensure that you have Node Version Manager (nvm) installed. You can install nvm by following the instructions at [nvm-sh/nvm](https://github.com/nvm-sh/nvm#installing-and-updating). nvm helps you easily switch to the Node.js version specified in [`.nvmrc`](.nvmrc).

Also, ensure that the [Ollama](https://ollama.com) host is installed on your local machine or available on your LAN:

### Linux

1. Install Ollama on your host.
2. Edit the systemd service file by running:
    ```sh
    sudo nano /etc/systemd/system/ollama.service
    ```
3. Add the following environment variables in the `[Service]` section:
    ```
    Environment="OLLAMA_HOST=0.0.0.0"
    Environment="OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*"
    ```
> [!NOTE]
> The `OLLAMA_HOST=0.0.0.0` setting is optional if the Ollama server is running on localhost and you do not need the Ollama server to be accessed from LAN.

4. Save the file, then reload and restart the service:
    ```sh
    sudo systemctl daemon-reload
    sudo systemctl restart ollama.service
    ```

### Windows

1. Install Ollama on your host.
2. On the machine running Ollama, set the environment variables:
    ```
    OLLAMA_HOST=0.0.0.0
    OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*
    ```
   You can do this via the System Properties or using PowerShell.
> [!NOTE]
> The `OLLAMA_HOST=0.0.0.0` setting is optional if the Ollama server is running on localhost and you do not need the Ollama server to be accessed from LAN.

3. Restart Ollama app.

## Development

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/code-forge-temple/scribe-pal.git
    cd scribe-pal
    ```

2. Set the Node.js version:
    - For Unix-based systems:
        ```sh
        nvm use
        ```
    - For Windows:
        ```sh
        nvm use $(cat .nvmrc)
        ```

3. Install dependencies:
    ```sh
    npm install
    ```

### Building

#### I. For development:

To build the project for development, run:

A. For Chromium-based browsers like Chrome, Vivaldi, Edge, Brave, Opera and others:
```sh
npm run dev:chrome
```

B. For Gecko-based browsers like Firefox, Waterfox, Pale Moon, and others:
```sh
npm run dev:mozilla
```

#### II. For production:

To build the project for production, run:

1. For Chromium-based browsers:
    ```sh
    npm run build:chrome
    ```

2. For Gecko-based browsers:
    ```sh
    npm run build:mozilla
    ```

### Linting

To lint the project, run:
```sh
npm run lint
```

### Installing

To install the the compiled extension, for:
- Chromium based browsers you need to go to 
    - `chrome://extensions/` (in Chrome browser)
    - `vivaldi://extensions/` (in Vivaldi browser)
    - `opera://extensions/`  (in Opera browser)
    - etc.

    and activate the `Developer Mode`, then `Load unpacked` then select `<scribe-pal folder>/dist/chrome` folder.

- For Gecko-based browsers, navigate to
    - `about:debugging#/runtime/this-firefox`
    - etc.

    and click on `Load Temporary Add-on…` then select `<scribe-pal folder>/dist/mozilla` folder.

## Usage

1. **Open the Extension Popup:**
   - Once installed, click the extension icon in your browser’s toolbar.
   - The popup allows you to set your configuration options.

2. **Configure Settings:**
   - **Ollama Server URL:**  
     Enter the URL for your Ollama API server in the provided text field and click “Save”.
   - **Theme Selection:**  
     Use the toggle switch to activate the dark theme as desired.

3. **Launch the Chat Interface:**
   - Click “Show ScribePal chat” within the popup, or within the current page press Ctrl+Shift+Y.
   - A draggable chat box will open on the active webpage.
   - Use the chat interface to send messages to the Ollama AI service, review conversation history, and manage models.
   - Additional features include capturing selected HTML content (that can be referenced in the discussion with `@captured` tag) and customizing prompts (to instruct the loaded model on how to answer).

4. **Interacting with the Chat:**
   - Type your query in the chat input and press Enter or click the `Send` button.
   - The AI response is rendered below the input as markdown.
   - You can manage (delete or refresh) available Ollama models using the available controls in the model select dropdown.

A short video tutorial on how to use the plugin:

[![IR7Jufc0zxo](https://img.youtube.com/vi/IR7Jufc0zxo/0.jpg)](https://www.youtube.com/watch?v=IR7Jufc0zxo)

## License
This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for more details.
