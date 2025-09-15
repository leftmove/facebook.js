# Facebook.js CLI Demo Recordings

This directory contains VHS tape files that demonstrate all the commands and their variants available in the Facebook.js CLI tool.

## Available Demo Tapes

### Help & Documentation

- `help-main.tape` - Shows main CLI help and version info
- `credentials-help.tape` - Shows credentials command help and alias
- `login-help.tape` - Shows login command help with all available flags
- `refresh-help.tape` - Shows refresh command help with all available flags
- `mcp-help.tape` - Shows MCP commands help

### Credentials Commands

- `credentials-view.tape` - View stored credentials (`npx facebook credentials view`)
- `credentials-clear.tape` - Clear stored credentials (`npx facebook credentials clear`)
- `credentials-store.tape` - Store credentials globally (`npx facebook credentials store`)
- `credentials-json.tape` - Get JSON credentials for MCP config (`npx facebook credentials json`)
- `credentials-shell.tape` - Get shell environment variables (`npx facebook credentials shell`)

### Login Commands

- `login-basic.tape` - Basic login without flags (`npx facebook login`)
- `login-with-flags.tape` - Login with common flags (--appId, --appSecret, --path, --scope, --credentials)
- `login-advanced-flags.tape` - Login with advanced flags (--pageId, --pageIndex, --userToken, --pageToken, --userId)

### Refresh Commands

- `refresh-basic.tape` - Basic refresh and refresh with custom credentials file

### MCP Commands

- `mcp-start-basic.tape` - Start MCP server via HTTP (`npx facebook mcp start`)
- `mcp-start-dual.tape` - Start MCP server with dual profile (`npx facebook mcp start --dual`)
- `mcp-raw-user.tape` - Start MCP server via stdio with user profile (`npx facebook mcp raw --profile user`)
- `mcp-raw-page.tape` - Start MCP server via stdio with page profile (`npx facebook mcp raw --profile page`)
- `mcp-raw-dual.tape` - Start MCP server via stdio with dual profile (`npx facebook mcp raw --profile dual`)

### Complete Workflow

- `workflow-complete.tape` - Shows the complete workflow from login to MCP server setup

## Command Reference

### Main Commands

```bash
npx facebook --help          # Show all available commands
npx facebook --version       # Show version info
```

### Credentials Management

```bash
npx facebook credentials view       # View stored credentials
npx facebook creds view            # Same as above (alias)
npx facebook credentials clear     # Clear all stored credentials
npx facebook credentials store     # Store credentials globally
npx facebook credentials json      # Get JSON for MCP config
npx facebook credentials shell     # Get shell environment variables
```

### Authentication

```bash
# Basic login
npx facebook login

# Login with flags
npx facebook login --appId YOUR_APP_ID --appSecret YOUR_APP_SECRET
npx facebook login --path ./custom-credentials.json
npx facebook login --scope '["pages_read_engagement","pages_manage_posts"]'
npx facebook login --credentials ./my-creds.json
npx facebook login --pageId YOUR_PAGE_ID
npx facebook login --pageIndex 0
npx facebook login --userToken YOUR_USER_TOKEN --pageToken YOUR_PAGE_TOKEN
npx facebook login --userId YOUR_USER_ID

# Refresh (same flags as login)
npx facebook refresh
npx facebook refresh --credentials ./my-creds.json
```

### MCP Server

```bash
# HTTP server
npx facebook mcp start           # Start with separate user/page endpoints
npx facebook mcp start --dual    # Start with combined endpoint

# Stdio server (for MCP clients)
npx facebook mcp raw                    # Default: page profile
npx facebook mcp raw --profile user     # User profile only
npx facebook mcp raw --profile page     # Page profile only
npx facebook mcp raw --profile dual     # Both user and page profiles
```

## Generating GIFs

To generate GIF files from these tapes, you need to have [VHS](https://github.com/charmbracelet/vhs) installed:

```bash
# Install VHS
brew install vhs

# Generate a specific GIF
vhs help-main.tape

# Generate all GIFs
for tape in *.tape; do vhs "$tape"; done
```

## Usage in Documentation

These GIFs can be embedded in documentation to show users exactly how to use each command:

```markdown
![Facebook.js Login Demo](./test/recording/login-basic.gif)
```
