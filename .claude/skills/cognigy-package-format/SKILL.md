---
name: cognigy-package-format
description: "Debug package import errors, inspect ZIP contents, or trace ID cross-references between nodeData/chart/flow/locale files. Use this whenever you see broken imports, need to understand the JSON structure inside a package, or are troubleshooting why a node or relation is missing -- even if the symptom is just 'flow looks wrong after import'."
user-invocable: false
dependencies: [node-reference]
source-files: [credit-card-analysis/]
---

# Cognigy Package Format

## ZIP Creation (CRITICAL)
ZIP must have NO directory entries -- only flat file paths. Cognigy's parser fails on empty directory entries with "Package Extraction Failed".
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
- `_id`: MongoDB ObjectId (24 hex chars) -- used as file names and as the primary key for every resource in the package
- `referenceId`: UUID v4 -- used for cross-resource references that survive re-import (IDs change on import, referenceIds don't)
- All resources share `projectReference` and `organisationReference` -- these get remapped to the target org on import

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
If any of these references point to a missing file, the import succeeds but the flow is broken -- nodes disappear or connections are missing.

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
**WARNING**: Do NOT include `knowledgeData` -- it's not in working packages and may cause import failure.

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
**WARNING**: `mock` field is REQUIRED on every node -- missing it causes import failure.
**Code nodes**: When `config.code` has content, include `hasError: false` and `transpiled: "<same code>"` in config.
