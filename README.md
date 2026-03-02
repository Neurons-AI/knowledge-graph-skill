# Knowledge Graph Skill

Embedded knowledge graph for AI agents. Stores structured knowledge as entities + relations in JSON, produces compact KGML summaries for LLM context.

## Features

- **Hybrid search**: Exact match + trigram fuzzy + BM25 (typo-tolerant, multilingual)
- **KGML format**: ~76% smaller than JSON, readable by all LLMs
- **20 entity types**: human, device, place, product, knowledge, routine, etc.
- **Encrypted vault**: AES-256-GCM secret storage
- **Budget-capped summaries**: Auto-scales from full (≤50 entities) to compact (>100)
- **Multi-platform**: OpenClaw, Claude Code, Gemini CLI
- **Zero external dependencies**: Pure JS, runs on Node 18+

## Quick Install

1. Copy this folder into your agent's workspace:
   ```bash
   cp -r knowledge-graph /path/to/workspace/skills/knowledge-graph
   ```

2. Run the install script from your workspace:
   ```bash
   cd /path/to/workspace
   node skills/knowledge-graph/scripts/install.mjs
   ```

That's it. The install script will:
- Create the data directory with an empty graph
- Detect your platform (OpenClaw / Claude Code / Gemini CLI)
- Patch your agent instructions file with KG usage instructions

## How It Works

After install, your agent will **autonomously**:
- Add entities when users mention people, projects, devices, decisions
- Search the graph before answering factual questions
- Track preferences, relationships, places, routines
- Store secrets in the encrypted vault

No prompting needed — the injected instructions tell the agent when and how to use the KG.

## Manual Usage

```bash
# Add entity
node skills/knowledge-graph/scripts/add.mjs quick "John Doe:human" --category people

# Search
node skills/knowledge-graph/scripts/query.mjs find "john"

# Traverse relationships
node skills/knowledge-graph/scripts/query.mjs traverse john-doe --depth 2

# Visualize
node skills/knowledge-graph/scripts/visualize.mjs
# → opens data/kg-viz.html

# See all commands
cat skills/knowledge-graph/SKILL.md
```

## Architecture

See [DESIGN.md](DESIGN.md) for full design rationale, benchmarks, and decisions.

## License

MIT
