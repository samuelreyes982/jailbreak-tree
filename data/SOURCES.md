# Seed Dataset — Sources

The initial 25 nodes were curated from the following authoritative sources.
Every node in `nodes.json` cites its primary origin paper/post; this file lists the
secondary sources used to *select* which techniques deserved a seed node.

## Survey papers used as taxonomy anchors

- **JailbreakRadar** — Chu et al., "Comprehensive Assessment of Jailbreak Attacks Against LLMs", arXiv:2402.05668. Covers 17 representative attacks across 6 categories. Used for category structure and to decide which optimization-based + obfuscation-based attacks to seed.
- **Yi et al. survey** — "Jailbreak Attacks and Defenses Against Large Language Models: A Survey", arXiv:2407.04295. Black-box vs. white-box division; broad named-technique catalog.
- **Yi et al. (2025)** — "From LLMs to MLLMs to Agents: A Survey of Emerging Paradigms in Jailbreak Attacks and Defenses within LLM Ecosystem", arXiv:2506.15170. Used to seed multimodal and agentic attack nodes.

## Benchmarks used to validate technique relevance

- **JailbreakBench** — Chao et al., NeurIPS 2024 D&B Track, arXiv:2404.01318. Baseline set: GCG, PAIR, JBC (human prompts), prompt+RS.
- **HarmBench** — Mazeika et al., 2024. Behavior set is shared with JailbreakBench (~55%).

## Vendor / industry disclosures

- Anthropic Research, "Many-shot Jailbreaking" (2024-04).
- Microsoft Security Blog, "Mitigating Skeleton Key" (Russinovich, 2024-06).
- Microsoft Research, "Crescendo Multi-Turn LLM Jailbreak Attack" (Russinovich et al., 2024-04).
- HiddenLayer, "Novel Universal Bypass for All Major LLMs" — Policy Puppetry (2025-04).

## Inclusion criteria (v0)

A technique was seeded if it met at least ONE of:
1. Published at a peer-reviewed venue OR on arXiv with ≥100 citations.
2. Acknowledged in a vendor system card, safety blog, or security advisory.
3. Catalogued as a category exemplar in two or more independent surveys.

This threshold filters out single-tweet "jailbreaks" and unreproduced anecdotes.
Anecdotal/unverified entries are explicitly out of scope for v0 — they get added in
v1 with `confidence: anecdotal` and a dashed border, per DESIGN.md §4.3.

## What was deliberately omitted from v0

- **Working payloads** — see DESIGN.md §8 (dual-use policy).
- **Closed-vendor unpatched 0-days** — wait for public disclosure.
- **Prompts with no published mechanism description** — folklore without a write-up isn't useful to defenders.
- **Discord-only or paywalled-source techniques** — can't independently verify.

## Verification status caveats

Per-model patch status in `nodes.json` is best-effort as of dataset creation
(2026-05-07) and based on cited papers' evaluations + vendor disclosures. Status
*rots*. The v3 roadmap (DESIGN.md §9) covers re-verification cadence — the
current entries are dated for that reason.
