# Riksdag-Regering MCP Server

[![MCP Protocol](https://img.shields.io/badge/MCP%20Protocol-2024--11--05-blue)](https://modelcontextprotocol.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A professional Model Context Protocol (MCP) server for accessing, searching, analyzing, and comparing data from the Swedish Parliament (Riksdagen) and the Government Offices (Regeringskansliet).

## Overview

The Riksdag-Regering MCP Server provides AI assistants with structured access to Swedish government data through 27 specialized tools and 5 comprehensive resources. Connect via remote HTTP or local installation to integrate Swedish parliamentary and governmental data into your AI workflows.

**Data Sources:**
- **Riksdagen** (20 tables): Members of Parliament, documents, speeches, votes, committees, and proposals
- **Regeringskansliet** (28 tables): Press releases, government bills, official reports (SOU), directives, and more

## Features

- **27 Tools** - Search, analyze, and compare across all data sources
- **5 Resources** - Structured reference data (parties, departments, document types)
- **Remote & Local** - Deploy to cloud or run locally via STDIO
- **Secure** - Built-in validation ensuring data only from official sources
- **Fast** - Intelligent caching and rate limiting
- **Robust** - OAuth 2.1 authentication, session management, structured logging

## Quick Start

### Option 1: Use Remote Server (Recommended)

Connect to the hosted MCP server without any installation:

**Remote URL:** `https://riksdag-regering-mcp.onrender.com`

#### Claude Desktop

Add to your config file:

**MacOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "riksdag-regering": {
      "transport": "http",
      "url": "https://riksdag-regering-mcp.onrender.com"
    }
  }
}
```

#### Other MCP Clients

Use the JSON-RPC 2.0 endpoint directly:

```bash
curl -X POST https://riksdag-regering-mcp.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### Option 2: Local Installation

Install and run the MCP server on your machine:

```bash
# Clone repository
git clone https://github.com/KSAklfszf921/Riksdag-Regering.AI.git
cd Riksdag-Regering.AI

# Install dependencies
npm run mcp:install

# Configure environment
cd mcp
cp .env.example .env
# Edit .env with your Supabase credentials

# Build and start
npm run build
npm start
```

#### Local STDIO Configuration

For local development with Claude Desktop:

```json
{
  "mcpServers": {
    "riksdag-regering": {
      "command": "node",
      "args": ["/absolute/path/to/Riksdag-Regering.AI/mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key-here"
      }
    }
  }
}
```

## Available Tools

### Search Tools (5)
- `search_ledamoter` - Find members of parliament by name, party, constituency
- `search_dokument` - Search parliamentary documents (motions, bills, reports)
- `search_anforanden` - Find speeches and debates
- `search_voteringar` - Search voting records
- `search_regering` - Search government documents (press releases, SOU, etc.)

### Analysis Tools (6)
- `analyze_partifordelning` - Analyze party distribution in parliament
- `analyze_votering` - Detailed voting statistics for specific votes
- `analyze_ledamot` - Member activity analysis (speeches, votes, documents)
- `analyze_dokument_statistik` - Document statistics and trends
- `analyze_trend` - Time-series trend analysis
- `analyze_regering_statistik` - Government document statistics

### Comparison Tools (4)
- `compare_ledamoter` - Compare two members' activities
- `compare_parti_rostning` - Compare party voting patterns between votes
- `compare_riksdag_regering` - Cross-reference parliament and government documents
- `compare_partier` - Compare two parties' activities

### Aggregate Tools (6)
- `top_ledamoter` - Most active members by various metrics
- `top_dokument` - Most referenced or debated documents
- `top_anforanden` - Most impactful speeches
- `top_voteringar` - Most significant votes
- `recent_aktivitet` - Recent parliamentary activity
- `global_search` - Unified search across all data sources

### Utility Tools (6)
- `get_ledamot_details` - Full member profile
- `get_dokument_details` - Complete document information
- `get_votering_details` - Detailed voting record
- `get_anforande_details` - Full speech transcript
- `get_regering_details` - Government document details
- `count_search_results` - Count matches before fetching

## Resources

The server provides structured reference data:

- `riksdagen://ledamoter` - All current members of parliament
- `riksdagen://partier` - Political parties overview
- `riksdagen://dokument/typer` - Document type reference
- `regeringen://departement` - Government departments
- `riksdagen://statistik` - Summary statistics

## Use Cases

**Political Research**
- Track voting patterns across parties
- Analyze member activity and engagement
- Monitor document trends over time

**Journalism**
- Cross-reference parliament and government on specific topics
- Find relevant speeches and debates
- Identify most active members on issues

**Data Analysis**
- Time-series analysis of parliamentary activity
- Party comparison and coalition analysis
- Document impact assessment

**AI Integration**
- Augment LLMs with Swedish government data
- Build conversational interfaces for civic data
- Create fact-checking tools

## Documentation

- **[MCP Server Technical Docs](mcp/README.md)** - Full technical documentation
- **[Deployment Guide](mcp/DEPLOYMENT.md)** - Cloud deployment instructions
- **[Installation Guide](mcp/INSTALL_GUIDE.md)** - Detailed setup instructions
- **[Usage Guide](mcp/USAGE_GUIDE.md)** - Tool usage examples
- **[Changelog](mcp/CHANGELOG.md)** - Version history

## Requirements

- Node.js 20 or later
- Supabase account (for local installation)
- MCP-compatible client (Claude Desktop, ChatGPT, etc.)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

```bash
# Install workspace
npm install

# Run MCP server in development mode
npm run mcp:dev

# Build MCP server
npm run mcp:build

# Run tests
npm run mcp:test
```

## License

MIT License - See [LICENSE](mcp/LICENSE) for details

## Acknowledgments

- **Riksdagen** - Open data API at [data.riksdagen.se](https://data.riksdagen.se/)
- **g0v.se** - Government data aggregation at [g0v.se](https://g0v.se/)
- **Anthropic** - Model Context Protocol specification

## Support

- **Issues:** [GitHub Issues](https://github.com/KSAklfszf921/Riksdag-Regering.AI/issues)
- **MCP Protocol:** [modelcontextprotocol.io](https://modelcontextprotocol.io/)

## Links

- **Live Server:** https://riksdag-regering-mcp.onrender.com
- **GitHub:** https://github.com/KSAklfszf921/Riksdag-Regering.AI
- **Riksdagen API:** https://data.riksdagen.se/
- **Regeringen Data:** https://g0v.se/

---

**Version 2.0** - Full MCP JSON-RPC 2.0 implementation with remote HTTP support
