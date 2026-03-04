---
name: cognigy-package-format
description: Load when debugging package import errors, inspecting ZIP contents, understanding nodeData/chart/flow JSON structure, or tracing ID cross-references between package files.
user-invocable: false
dependencies: [node-reference]
source-files: [credit-card-analysis/]
---

# Cognigy Package Format

## ZIP Creation (CRITICAL)
ZIP must have NO directory entries — only flat file paths. Cognigy's parser fails on empty directory entries.
```bash
# CORRECT:
find . -type f | sed 's|^\./||' | zip -D -@ output.zip

# WRONG (creates dir entries that break import):
zip -r output.zip .
```

## ZIP Structure
```
package.zip/
├── index.json              # Package metadata (NO knowledgeData field)
├── locale/{_id}            # Locale definition (en-US)
├── flow/{_id}              # Flow definition (name, chartReference)
├── chart/{_id}             # Node graph (relations array)
├── nodeData/{_id}          # Individual node configs (MUST have mock field)
├── flowState/{_id}         # Intent blacklist (flowReference)
├── flowSettings/{_id}      # Flow behavior settings (flowReference)
├── intentTrainGroup/{_id}  # NLU training group (flowReference)
├── aiAgent/{_id}           # AI Agent persona (optional)
└── [other optional dirs]   # largeLanguageModel, knowledgeStore, connection, endpoint
```

## ID System
- `_id`: MongoDB ObjectId (24 hex chars) — used as file names
- `referenceId`: UUID v4 — used for cross-resource references
- All resources share `projectReference` and `organisationReference`

## Cross-Reference Map
```
flow.chartReference        → chart._id
chart.resourceReference    → flow._id
nodeData.chartReference    → chart._id
nodeData.resourceReference → flow._id
nodeData.localizedData[0].localeReference → locale._id
flowState.flowReference    → flow._id
flowSettings.flowReference → flow._id
intentTrainGroup.flowReference → flow._id
aiAgentJob.config.aiAgent  → aiAgent.referenceId (UUID)
```

## Chart Relations Structure
Each entry in `chart.relations[]`:
```json
{
  "node": "nodeData _id",
  "children": ["nodeData _id", ...],
  "next": "nodeData _id" | null,
  "_id": "unique relation id"
}
```
- `node`: The nodeData this relation describes
- `children`: Child nodes (e.g., Once→[OnFirstExecution, Afterwards], AIAgentJob→[Default, Tool1, Tool2])
- `next`: Next node in sequence (null = terminal)

## File Schemas

### index.json
```json
{"cognigyVersion":"2026.4.0","type":"package","createdAt":"ISO","name":"...","description":"","resourcesHash":"40hex"}
```
**WARNING**: Do NOT include `knowledgeData` — it's not in working packages and may cause import failure.

### nodeData (common fields)
```json
{
  "_id":"...","referenceId":"UUID","type":"start|end|code|say|aiAgentJob|...",
  "label":"...","comment":"","commentColor":"","analyticsLabel":null,
  "isDisabled":false,"isEntryPoint":false,
  "mock":{"isEnabled":false,"code":""},
  "localizedData":[{"config":{...},"preview":"","localeReference":"localeId"}],
  "chartReference":"chartId","extension":"@cognigy/basic-nodes",
  "resourceReference":"flowId","projectReference":"...","organisationReference":"..."
}
```
**WARNING**: `mock` field is REQUIRED on every node — missing it causes import failure.
**Code nodes**: When `config.code` has content, include `hasError: false` and `transpiled: "<same code>"` in config.
