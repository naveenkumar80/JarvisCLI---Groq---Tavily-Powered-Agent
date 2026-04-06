# JarvisCLI - Groq & Tavily Powered Agent

A conversational AI assistant running in the terminal, powered by Groq's fast LLM inference and Tavily's web search API. It features a tool-calling setup allowing the assistant to browse the web when required to answer questions.

## Features

- **Interactive CLI:** Chat with the assistant directly from your terminal.
- **Web Search Integration:** Automatically detects when information from the web is needed and uses Tavily to perform web searches.
- **Fast Inference:** Uses Groq to run open-source models with blazing fast speed.
- **Persona:** Pre-configured with a "smart but humorous" Jarvis persona.

## Prerequisites

- Node.js (v18 or higher recommended)
- API Keys:
  - [Groq API Key](https://console.groq.com/keys)
  - [Tavily API Key](https://app.tavily.com/)

## Installation

1. Clone or download this repository.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

## Usage

Start the interactive assistant by running:

```bash
node app.js
```

Type your messages, and the assistant will reply. Type **`bye`** to exit the application.

## For Python Users (Optional)

Although this is primarily a Node.js project, a `requirements.txt` file is included in the project root if you plan to port this repository or use equivalent Python libraries (`groq`, `tavily-python`, etc.). 

You can install the Python equivalents using:
```bash
pip install -r requirements.txt
```
