const { generateObjectId, generateUUID, generateResourcesHash } = require("./id-generator");
const { DEFAULT_COGNIGY_VERSION, DEFAULT_AI_AGENT_SAFETY } = require("./defaults");
const { buildFlow } = require("./flow-builder");

/**
 * Build a complete Cognigy package ready for ZIP creation.
 *
 * packageSpec = {
 *   name: "Package Name",
 *   description: "Package description",
 *   cognigyVersion: "2026.4.0",  // optional
 *   projectRef: "...",   // optional, auto-generated if not provided
 *   orgRef: "...",       // optional, auto-generated if not provided
 *   aiAgent: {                    // optional AI Agent persona
 *     name: "Sophia",
 *     description: "Sophia works for Acme Corp.",
 *     instructions: "Be friendly and professional.",
 *     speakingStyle: { formality: "balanced", completeness: "concise" },
 *   },
 *   flows: [
 *     {
 *       name: "Flow Name",
 *       agentName: "...",
 *       agentDescription: "...",
 *       instructionsCode: "context.instructions = `...`",
 *       authCode: "...",
 *       knowledgeCode: "...",
 *       voiceConfig: { ... },
 *       tools: [ ... ],
 *     }
 *   ]
 * }
 */
function buildPackage(packageSpec) {
  const projectRef = packageSpec.projectRef || generateObjectId();
  const orgRef = packageSpec.orgRef || generateObjectId();
  const localeId = generateObjectId();

  // Create locale
  const locale = {
    _id: localeId,
    referenceId: generateUUID(),
    name: "en-US",
    primary: true,
    nluLanguage: "en-US",
    projectReference: projectRef,
    organisationReference: orgRef,
    createdAt: Math.floor(Date.now() / 1000),
    lastChanged: Math.floor(Date.now() / 1000),
    createdBy: "package-generator",
    lastChangedBy: "package-generator",
  };

  // Create AI Agent if specified
  let aiAgent = null;
  if (packageSpec.aiAgent) {
    aiAgent = {
      _id: generateObjectId(),
      referenceId: generateUUID(),
      name: packageSpec.aiAgent.name || "AI Agent",
      description: packageSpec.aiAgent.description || "",
      image: "",
      imageOptimizedFormat: false,
      speakingStyle: packageSpec.aiAgent.speakingStyle || {
        formality: "balanced",
        completeness: "concise",
      },
      voiceConfigs: {
        ttsVoice: "",
        ttsLanguage: "",
        ttsVendor: "none",
        ttsModel: "",
        ttsLabel: "",
        ttsDisableCache: false,
      },
      enableVoiceConfigs: false,
      safetySettings: DEFAULT_AI_AGENT_SAFETY,
      instructions: packageSpec.aiAgent.instructions || "",
      contactProfilesOption: "completeProfile",
      contactProfilesSelected: [],
      projectReference: projectRef,
      organisationReference: orgRef,
      createdBy: "package-generator",
      createdAt: Math.floor(Date.now() / 1000),
      lastChangedBy: "package-generator",
      lastChanged: Math.floor(Date.now() / 1000),
    };
  }

  // Build flows
  const flowResults = [];
  for (const flowSpec of packageSpec.flows || []) {
    // Inject AI Agent reference if available
    if (aiAgent && !flowSpec.aiAgentRef) {
      flowSpec.aiAgentRef = aiAgent.referenceId;
    }
    const result = buildFlow(flowSpec.name, flowSpec, projectRef, orgRef, localeId);
    flowResults.push(result);
  }

  // Build index.json
  const index = {
    cognigyVersion: packageSpec.cognigyVersion || DEFAULT_COGNIGY_VERSION,
    type: "package",
    createdAt: new Date().toISOString(),
    name: packageSpec.name || "Generated Package",
    description: packageSpec.description || "",
    resourcesHash: generateResourcesHash(),
    knowledgeData: [],
  };

  // Assemble all files
  const files = {};

  // Index
  files["index.json"] = index;

  // Locale
  files[`locale/${locale._id}`] = locale;

  // AI Agent
  if (aiAgent) {
    files[`aiAgent/${aiAgent._id}`] = aiAgent;
  }

  // Flows
  for (const fr of flowResults) {
    files[`flow/${fr.flow._id}`] = fr.flow;
    files[`chart/${fr.chart._id}`] = fr.chart;
    files[`flowState/${fr.flowState._id}`] = fr.flowState;
    files[`flowSettings/${fr.flowSettings._id}`] = fr.flowSettings;
    files[`intentTrainGroup/${fr.intentTrainGroup._id}`] = fr.intentTrainGroup;

    for (const node of fr.nodes) {
      files[`nodeData/${node._id}`] = node;
    }
  }

  return files;
}

module.exports = { buildPackage };
