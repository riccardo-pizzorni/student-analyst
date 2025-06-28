# MCP Environment Variables Setup Guide

## Overview

The MCP (Model Context Protocol) configuration for Task Master AI now uses environment variables for secure API key management.

## Required Environment Variables

### Primary API Key (Required)

```bash
OPENROUTER_API_KEY=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
```

### Optional API Keys (Configure as needed)

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
XAI_API_KEY=your_xai_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
OLLAMA_API_KEY=your_ollama_api_key_here
```

## Setup Instructions

### Windows (PowerShell)

```powershell
# Set environment variables for current session
$env:OPENROUTER_API_KEY="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"

# Set permanent environment variables (requires admin)
[System.Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", "your_key_here", "User")
```

### macOS/Linux (Bash)

```bash
# Add to ~/.bashrc or ~/.zshrc
export OPENROUTER_API_KEY="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"
```

### VS Code Integration

Add to your VS Code settings.json:

```json
{
  "terminal.integrated.env.windows": {
    "OPENROUTER_API_KEY": "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"
  }
}
```

## Security Best Practices

1. **Never commit API keys to Git**
2. **Use environment variables instead of hardcoded values**
3. **Rotate API keys regularly**
4. **Limit API key permissions where possible**
5. **Monitor API key usage for suspicious activity**

## Verification

Test that your environment variables are set correctly:

```bash
# Windows
echo $env:OPENROUTER_API_KEY

# macOS/Linux
echo $OPENROUTER_API_KEY
```

## Troubleshooting

If Task Master AI is not working:

1. Verify environment variables are set
2. Restart your IDE after setting variables
3. Check API key validity
4. Ensure no typos in variable names
