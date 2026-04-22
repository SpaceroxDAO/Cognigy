/**
 * Sofia — Salesforce Pipeline (Super Simple Teams Demo)
 * Always responds with the Q2 2026 pipeline Adaptive Card, no matter what the user says.
 * No xApps, no auth, no extra tools. One tool, one card, every time.
 */
const { cloneAndModify } = require("./cognigy-package-generator/clone-and-modify");

const SOURCE_DIR = "./credit-card-analysis";
const OUTPUT_PATH = "./Apex-Sofia-Salesforce-Simple.zip";

// ─── Adaptive Card (always sent, verbatim) ────────────────────────────────────

const PIPELINE_CARD = {
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.5",
  "msteams": { "width": "Full" },
  "body": [
    {
      "type": "Container",
      "style": "emphasis",
      "bleed": true,
      "items": [
        { "type": "TextBlock", "text": "Salesforce · CRM Intelligence", "size": "Small", "isSubtle": true, "wrap": true },
        { "type": "TextBlock", "text": "Open Opportunities — Q2 2026", "weight": "Bolder", "size": "Large", "wrap": true, "color": "Accent" }
      ]
    },
    {
      "type": "ColumnSet",
      "spacing": "Medium",
      "columns": [
        {
          "type": "Column", "width": "stretch",
          "items": [{ "type": "Container", "style": "good", "items": [
            { "type": "TextBlock", "text": "PIPELINE", "size": "Small", "weight": "Bolder", "horizontalAlignment": "Center", "wrap": true },
            { "type": "TextBlock", "text": "$1.24M", "weight": "Bolder", "size": "Medium", "horizontalAlignment": "Center", "wrap": true }
          ]}]
        },
        {
          "type": "Column", "width": "stretch",
          "items": [{ "type": "Container", "style": "accent", "items": [
            { "type": "TextBlock", "text": "CLOSED WON", "size": "Small", "weight": "Bolder", "horizontalAlignment": "Center", "wrap": true },
            { "type": "TextBlock", "text": "$387K", "weight": "Bolder", "size": "Medium", "horizontalAlignment": "Center", "wrap": true }
          ]}]
        },
        {
          "type": "Column", "width": "stretch",
          "items": [{ "type": "Container", "style": "attention", "items": [
            { "type": "TextBlock", "text": "DEALS", "size": "Small", "weight": "Bolder", "horizontalAlignment": "Center", "wrap": true },
            { "type": "TextBlock", "text": "7", "weight": "Bolder", "size": "Medium", "horizontalAlignment": "Center", "wrap": true }
          ]}]
        }
      ]
    },
    { "type": "TextBlock", "text": "ACTIVE OPPORTUNITIES", "weight": "Bolder", "size": "Small", "spacing": "Medium", "wrap": true },
    {
      "type": "Container",
      "style": "default",
      "items": [
        { "type": "FactSet", "separator": true, "facts": [
          { "title": "DataStream Corp", "value": "$142K · Proposal" },
          { "title": "Owner", "value": "Sofia Reyes · 45 days in stage" }
        ]},
        { "type": "FactSet", "separator": true, "facts": [
          { "title": "Nortek Industries", "value": "$87.5K · Closed Won" },
          { "title": "Owner", "value": "Adam Boyle · 12 days in stage" }
        ]},
        { "type": "FactSet", "separator": true, "facts": [
          { "title": "Meridian Health Systems", "value": "$215K · Negotiation" },
          { "title": "Owner", "value": "Sofia Reyes · 7 days in stage" }
        ]},
        { "type": "FactSet", "separator": true, "facts": [
          { "title": "Clearwater Financial", "value": "$98K · Discovery" },
          { "title": "Owner", "value": "Adam Boyle · 3 days in stage" }
        ]}
      ]
    },
    {
      "type": "Container",
      "style": "warning",
      "spacing": "Medium",
      "items": [
        { "type": "TextBlock", "text": "PENDING DEAL APPROVAL", "weight": "Bolder", "size": "Small", "wrap": true },
        { "type": "TextBlock", "text": "Meridian Health — 15% discount request", "weight": "Bolder", "wrap": true },
        { "type": "TextBlock", "text": "Submitted by Sofia Reyes · Mar 28, 2026", "isSubtle": true, "spacing": "None", "wrap": true }
      ]
    }
  ],
  "actions": [
    { "type": "Action.Submit", "title": "Approve", "style": "positive", "data": { "action": "deal_approved", "account": "Meridian Health" } },
    { "type": "Action.Submit", "title": "Reject",  "style": "destructive", "data": { "action": "deal_rejected", "account": "Meridian Health" } },
    { "type": "Action.Submit", "title": "Close",   "data": { "action": "close" } }
  ]
};

// ─── Post-processing: always output the card, suppress AI text ────────────────

const postProcessingCode = `
// Always output the pipeline card — ignore all other context and AI output
var card = ${JSON.stringify(PIPELINE_CARD, null, 2)};
actions.output('', {
  _cognigy: {
    _default: {
      _adaptiveCard: card
    }
  }
});
`;

// ─── Spec ─────────────────────────────────────────────────────────────────────

cloneAndModify(
  SOURCE_DIR,
  {
    flowName: "Apex Sofia — Salesforce Pipeline Simple",
    description: "Simple Salesforce pipeline demo. Always returns the Q2 2026 Adaptive Card regardless of user input. For Teams demos.",

    instructionsCode: `context.instructions = \`
You are Sofia, the Salesforce Sales Intelligence agent at Apex Technologies.
No matter what the user says, call get_salesforce_pipeline immediately.
Do not greet. Do not explain. Do not ask questions. Just call the tool.
\`;`,

    knowledgeCode: `context.channel = 'teams'; context.agentPersona = 'Sofia';`,

    agentJobConfig: {
      name: "Sofia — Salesforce Pipeline",
      description: "Always returns the Q2 2026 Salesforce pipeline Adaptive Card.",
      instructions: "{{context.instructions}}",
      outputImmediately: false,
      storeLocation: "context",
    },

    postProcessingCode,

    tools: [
      {
        label: "Get Salesforce Pipeline",
        toolId: "get_salesforce_pipeline",
        description: "Returns the Q2 2026 Salesforce opportunity pipeline. Call this for EVERY user message without exception — no matter what the user says.",
        useParameters: false,
        parameters: {},
        code: `context.pipelineLoaded = true; context.lastToolId = 'get_salesforce_pipeline';`,
        answer: "Pipeline data loaded.",
      },
    ],
  },
  OUTPUT_PATH
);
