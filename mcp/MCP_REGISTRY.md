# MCP Registry Registration Guide

## Status
✅ **server.json Created** - Ready for registration when mcp-publisher CLI is available

## Registration Information

**Server Name:** `io.github.KSAklfszf921/riksdag-regering-mcp`
**Current Version:** 2.0.0
**Repository ID:** 1087404908

## Required Files

✅ `server.json` - Complete MCP Registry metadata file (located in `mcp/` folder)

## When CLI Becomes Available

Once `@modelcontextprotocol/mcp-publisher` is published to npm, register with:

```bash
# Install publisher CLI
npm install -g @modelcontextprotocol/mcp-publisher

# Navigate to mcp directory
cd mcp

# Authenticate with GitHub
mcp-publisher login github

# Publish server
mcp-publisher publish
```

## Alternative: Manual Build from Source

If you need to register before npm publication:

```bash
# Clone MCP Registry repo
git clone https://github.com/modelcontextprotocol/registry.git
cd registry

# Build publisher CLI
make publisher

# Use the built CLI
./bin/mcp-publisher --help
```

## Verification

After publishing, verify registration:

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.KSAklfszf921/riksdag-regering-mcp"
```

## Documentation

- **Official Registry:** https://registry.modelcontextprotocol.io
- **Documentation:** https://registry.modelcontextprotocol.io/docs
- **GitHub Repo:** https://github.com/modelcontextprotocol/registry
- **Blog Post:** http://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/

## Current Access Methods

While awaiting official registry listing, the server is accessible via:

### 1. Remote HTTP (Recommended)
```bash
claude mcp add riksdag-regering --transport http https://riksdag-regering-ai.onrender.com/mcp
```

### 2. npm Package
```bash
npm install -g riksdag-regering-mcp
```

### 3. Local Installation
```bash
git clone https://github.com/KSAklfszf921/Riksdag-Regering-MCP.git
cd Riksdag-Regering-MCP/mcp
npm install && npm run build
```

---

**Last Updated:** 2025-11-19
**Next Action:** Register when mcp-publisher CLI becomes available on npm
