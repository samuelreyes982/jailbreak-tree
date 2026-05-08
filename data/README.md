# Seed Dataset — v0

25 verified jailbreak techniques across 8 families, with lineage edges.

## Files

- `nodes.json` — array of node objects (schema: see DESIGN.md §4.1).
- `edges.json` — array of typed edges (schema: see DESIGN.md §4.2).
- `SOURCES.md` — provenance and inclusion criteria for the seed.

## Families covered

| Family | Nodes |
|---|---|
| `persona-roleplay` | DAN, AIM, JailbreakHub, Skeleton Key |
| `context-manipulation` | Crescendo, Many-shot |
| `obfuscation` | Base64, Low-resource lang, CipherChat, ArtPrompt |
| `optimization` | GCG, AutoDAN, GPTFuzz, Best-of-N |
| `llm-as-attacker` | PAIR, TAP |
| `fine-tuned-attacker` | MasterKey, AdvPrompter |
| `decoding-attack` | Generation Exploitation |
| `prompt-injection` | Direct, Indirect, Policy Puppetry |
| `multimodal` | FigStep, Visual Adversarial (Qi) |
| `weight-attack` | Harmful fine-tuning |

## Edges

26 lineage edges using 3 of the 5 edge types: `evolved-from`, `inspired-by`, `generalizes`.
`combines` and `defense-bypass-of` are unused at v0 — they'll show up once we add
defense nodes and explicit hybrid-technique nodes (e.g. AutoDAN-Turbo, Combination attack).

## Confidence breakdown

- `peer-reviewed`: 19
- `vendor-confirmed`: 4 (many-shot, Skeleton Key, Crescendo, Policy Puppetry)
- `community-reproduced`: 2 (DAN, AIM)
- `anecdotal`: 0 (excluded from v0 per inclusion criteria — see SOURCES.md)

## Next additions (v0.1)

Tagged but not yet seeded; pull these in next:
- ReNeLLM (scenario nesting)
- DRA (Disguise & Reconstruction)
- COLD-Attack (constrained Langevin)
- ARCA (input/output joint optimization)
- HADES (multimodal harm amplification)
- AGENTPOISON (agent backdoor)
- BrowserART (browser agent red-team)
- MRJ-Agent (multi-turn agent)
- Multi-turn human red team / persuasion attacks (Zeng et al., PAP)
- Memory injection (agent persistent memory)
