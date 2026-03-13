---
name: node-reference
description: "Look up any Cognigy node type's config fields, extension name, or localizedData schema. Use this whenever you need to know what fields a node type expects, what extension it belongs to, or how to configure a specific node -- covers all node types used in AI Agent flows including aiAgentJob, code, say, setSessionConfig, and tool nodes."
user-invocable: false
dependencies: []
source-files: [credit-card-analysis/nodeData/]
---

# Cognigy Node Type Reference

## Core Nodes
| Type | Label | Config |
|------|-------|--------|
| `start` | Start | `{}` (isEntryPoint: true) |
| `end` | End | `{}` |
| `once` | Once | `{}` (parent: children=[onFirstExecution, afterwards]) |
| `onFirstExecution` | On First Execution | `{}` (child of once) |
| `afterwards` | Afterwards | `{}` (child of once) |

## AI Agent Nodes
| Type | Label | Key Config Fields |
|------|-------|-------------------|
| `aiAgentJob` | AI Agent | aiAgent(UUID), name, description, instructions, toolChoice("auto"), memoryType("inherit"), knowledgeSearchBehavior("onDemand"), storeLocation("stream"), outputImmediately(true), temperature(0.7), maxTokens(4000), timeoutInMs(8000) |
| `aiAgentJobDefault` | Default | `{}` (first child of aiAgentJob) |
| `aiAgentJobTool` | [Tool Name] | toolId, description, useParameters(bool), parameters(JSON Schema string), debugMessage(true) |
| `aiAgentToolAnswer` | Resolve Tool Action | answer(string, supports CognigyScript), debugToolAnswer(false) |
| `aiAgentHandover` | AI Agent Handover | flowNode.flow(UUID), flowNode.node(UUID) |

## Logic Nodes
| Type | Config |
|------|--------|
| `code` | code(JS string) |
| `if` | condition(CognigyScript expression) -- children: [then, else] |
| `then` | `{}` (child of if) |
| `else` | `{}` (child of if) |
| `goTo` | targetFlowId, targetNodeId |

## Output Nodes
| Type | Config |
|------|--------|
| `say` | say(JSON: {text, type, _cognigy}) |
| `setSessionConfig` | sttVendor, sttLanguage, sttModel, ttsVendor, ttsVoice, ttsLanguage, ttsModel, bargeIn, endpointing, noInputTimeout, dtmfEnable |
| `sendSMS` | to, body |
| `hangup` | `{}` |

## Data Nodes
| Type | Config |
|------|--------|
| `addToContext` | key, value, mode("simple") |
| `sleep` | amount(seconds) |
| `wait` | `{}` |
| `placeholder` | text, data |

## AI Agent Job Config Defaults
```json
{
  "toolChoice": "auto",
  "memoryType": "inherit",
  "memoryContextInjection": "[[snippet-eyJ0eXBlIjoiY29udGV4dCIsImxhYmVsIjoiU2hvcnQtVGVybSBNZW1vcnkiLCJzY3JpcHQiOiJjb250ZXh0LnNob3J0VGVybU1lbW9yeSJ9]]",
  "knowledgeSearchBehavior": "onDemand",
  "knowledgeSearchTopK": 3,
  "storeLocation": "stream",
  "outputImmediately": true,
  "streamStopTokens": [".", "!", "?", "\\n"],
  "temperature": 0.7,
  "maxTokens": 4000,
  "timeoutInMs": 8000,
  "errorHandling": "continue",
  "processImages": false
}
```

## Tool Parameter JSON Schema Pattern
```json
{
  "type": "object",
  "properties": {
    "param_name": {"type": "string", "description": "What this param is for."},
    "action": {"type": "string", "enum": ["get", "update"], "description": "Operation to run."}
  },
  "required": ["param_name"],
  "additionalProperties": false
}
```
