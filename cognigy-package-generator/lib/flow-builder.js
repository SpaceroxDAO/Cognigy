const { generateObjectId, generateUUID, generateResourcesHash } = require("./id-generator");
const { DEFAULT_FLOW_SETTINGS, DEFAULT_COGNIGY_VERSION } = require("./defaults");
const nodeBuilder = require("./node-builder");

/**
 * Build a complete Cognigy flow with all required files.
 * Returns an object with all the resources needed.
 */
function buildFlow(flowName, spec, projectRef, orgRef, localeId) {
  const flowId = generateObjectId();
  const chartId = generateObjectId();
  const refs = { chartRef: chartId, flowRef: flowId, localeRef: localeId, projectRef, orgRef };

  // 1. Create flow definition
  const flow = {
    _id: flowId,
    referenceId: generateUUID(),
    name: flowName,
    context: {},
    attachedFlows: [],
    localizedData: [
      {
        attachedLexiconReferences: [],
        localeReference: localeId,
      },
    ],
    img: "",
    projectReference: projectRef,
    organisationReference: orgRef,
    createdAt: Math.floor(Date.now() / 1000),
    lastChanged: Math.floor(Date.now() / 1000),
    createdBy: "package-generator",
    lastChangedBy: "package-generator",
    chartReference: chartId,
  };

  // 2. Build all nodes and chart relations
  const { nodes, relations } = buildFlowChart(spec, refs);

  // 3. Create chart
  const chart = {
    _id: chartId,
    relations,
    resourceReference: flowId,
    projectReference: projectRef,
    organisationReference: orgRef,
  };

  // 4. Create flowState
  const flowState = {
    _id: generateObjectId(),
    name: "default",
    type: "blacklist",
    isDefault: true,
    referenceId: generateUUID(),
    intentReferences: [],
    flowReference: flowId,
    projectReference: projectRef,
    organisationReference: orgRef,
    createdAt: Math.floor(Date.now() / 1000),
    lastChanged: Math.floor(Date.now() / 1000),
    createdBy: "package-generator",
    lastChangedBy: "package-generator",
  };

  // 5. Create flowSettings
  const flowSettings = {
    _id: generateObjectId(),
    ...DEFAULT_FLOW_SETTINGS,
    flowReference: flowId,
    projectReference: projectRef,
    organisationReference: orgRef,
  };

  // 6. Create intentTrainGroup
  const intentTrainGroup = {
    _id: generateObjectId(),
    nluOptions: {},
    referenceId: generateUUID(),
    lastChanged: Math.floor(Date.now() / 1000),
    localeReference: localeId,
    lastChangedBy: "package-generator",
    lastTrainedAt: 0,
    lastTrainedBy: null,
    flowReference: flowId,
    projectReference: projectRef,
    organisationReference: orgRef,
    lexiconsInServiceMatcher: true,
    lastRelevantChangeAt: Math.floor(Date.now() / 1000),
    lastRelevantChangeBy: "package-generator",
  };

  return {
    flow,
    chart,
    nodes,
    flowState,
    flowSettings,
    intentTrainGroup,
  };
}

/**
 * Build the chart structure from a flow specification.
 *
 * spec = {
 *   agentName: "Customer Support Specialist",
 *   agentDescription: "You resolve customer issues...",
 *   agentInstructions: "- Pretend to be an expert...",  // short inline instructions
 *   aiAgentRef: "UUID",  // referenceId of the AI Agent persona
 *   instructionsCode: "context.instructions = `...`",  // full instructions via Code node
 *   authCode: "...",      // optional auth mock code
 *   knowledgeCode: "...", // optional knowledge setup code
 *   voiceConfig: { ttsVoice: "...", ... },  // optional voice settings
 *   tools: [
 *     {
 *       label: "Tool Name",
 *       toolId: "snake_case_id",
 *       description: "What this tool does",
 *       useParameters: true,
 *       parameters: { type: "object", properties: {...}, required: [...] },
 *       // Tool action handling - one of:
 *       answer: "Simple answer string",              // Direct resolve
 *       code: "// JS code to process tool action",   // Code node + resolve
 *       codeAnswer: "{{context.result}}",             // Answer after code (uses CognigyScript)
 *     },
 *     ...
 *   ]
 * }
 */
function buildFlowChart(spec, refs) {
  const { chartRef, flowRef, localeRef, projectRef, orgRef } = refs;
  const r = [chartRef, flowRef, localeRef, projectRef, orgRef];

  const nodes = [];
  const relations = [];

  // Helper to add a node and return its _id
  function addNode(node) {
    nodes.push(node);
    return node._id;
  }

  // Helper to add a relation
  function addRelation(nodeId, children, next) {
    relations.push({
      node: nodeId,
      children: children || [],
      next: next || null,
      _id: generateObjectId(),
    });
  }

  // --- Build the flow structure ---

  // Start node
  const startId = addNode(nodeBuilder.createStartNode(...r));

  // Once node (wrapper for setup code)
  const onceId = addNode(nodeBuilder.createOnceNode(...r));

  // On First Execution child of Once
  const onFirstId = addNode(nodeBuilder.createOnFirstExecutionNode(...r));

  // Afterwards child of Once
  const afterwardsId = addNode(nodeBuilder.createAfterwardsNode(...r));

  // Setup code nodes (children under OnFirstExecution)
  const setupNodeIds = [];

  // Instructions Code node
  if (spec.instructionsCode) {
    const instrNode = nodeBuilder.createCodeNode("Instructions", spec.instructionsCode, ...r);
    setupNodeIds.push(addNode(instrNode));
  }

  // Auth Code node
  if (spec.authCode) {
    const authNode = nodeBuilder.createCodeNode("Auth", spec.authCode, ...r);
    setupNodeIds.push(addNode(authNode));
  }

  // Knowledge Code node
  if (spec.knowledgeCode) {
    const knowledgeNode = nodeBuilder.createCodeNode("Knowledge", spec.knowledgeCode, ...r);
    setupNodeIds.push(addNode(knowledgeNode));
  }

  // Set Session Config node (for voice flows)
  let sessionConfigId = null;
  if (spec.voiceConfig) {
    const scNode = nodeBuilder.createSetSessionConfigNode("Set Session Config", spec.voiceConfig, ...r);
    sessionConfigId = addNode(scNode);
  }

  // AI Agent Job node
  const aiAgentJobConfig = {
    aiAgent: spec.aiAgentRef || "",
    name: spec.agentName || "Customer Support Specialist",
    description: spec.agentDescription || "You resolve customer issues and ensure a positive experience.",
    instructions: spec.agentInstructions || "- Pretend to be an expert in your area.\n- Never answer questions that are outside your job.",
  };
  const aiAgentJobId = addNode(nodeBuilder.createAiAgentJobNode(aiAgentJobConfig, ...r));

  // Default child of AI Agent Job
  const defaultId = addNode(nodeBuilder.createAiAgentJobDefaultNode(...r));

  // Tool children of AI Agent Job
  const toolBranchData = []; // { toolNodeId, childNodeIds }
  for (const tool of spec.tools || []) {
    const toolNodeId = addNode(nodeBuilder.createAiAgentJobToolNode(tool.label || tool.toolId, tool, ...r));

    const childIds = [];

    if (tool.code) {
      // Code node to process the tool action
      const codeId = addNode(nodeBuilder.createCodeNode(tool.label + " Logic", tool.code, ...r));
      childIds.push(codeId);
    }

    // Resolve Tool Action node
    const answer = tool.codeAnswer || tool.answer || "Action completed.";
    const resolveId = addNode(nodeBuilder.createResolveToolActionNode(answer, ...r));
    childIds.push(resolveId);

    toolBranchData.push({ toolNodeId, childIds });
  }

  // End node
  const endId = addNode(nodeBuilder.createEndNode(...r));

  // --- Build relations ---

  // Chain setup nodes sequentially
  let firstSetupId = null;
  for (let i = 0; i < setupNodeIds.length; i++) {
    const nextSetupId = i + 1 < setupNodeIds.length ? setupNodeIds[i + 1] : null;
    addRelation(setupNodeIds[i], [], nextSetupId);
    if (i === 0) firstSetupId = setupNodeIds[i];
  }

  // OnFirstExecution → first setup node (as child chain)
  addRelation(onFirstId, firstSetupId ? [firstSetupId] : [], null);

  // Afterwards → nothing (empty branch)
  addRelation(afterwardsId, [], null);

  // Once → children: [OnFirstExecution, Afterwards]
  // Determine what comes after Once
  let afterOnce = sessionConfigId || aiAgentJobId;
  addRelation(onceId, [onFirstId, afterwardsId], afterOnce);

  // Set Session Config → AI Agent Job
  if (sessionConfigId) {
    addRelation(sessionConfigId, [], aiAgentJobId);
  }

  // AI Agent Job → children: [Default, ...tools], next: End
  const aiAgentChildren = [defaultId, ...toolBranchData.map((t) => t.toolNodeId)];
  addRelation(aiAgentJobId, aiAgentChildren, endId);

  // Default → nothing
  addRelation(defaultId, [], null);

  // Tool branches
  for (const branch of toolBranchData) {
    // Chain child nodes sequentially
    let firstChildId = branch.childIds.length > 0 ? branch.childIds[0] : null;
    for (let i = 0; i < branch.childIds.length; i++) {
      const nextChildId = i + 1 < branch.childIds.length ? branch.childIds[i + 1] : null;
      addRelation(branch.childIds[i], [], nextChildId);
    }
    // Tool node → next: first child
    addRelation(branch.toolNodeId, [], firstChildId);
  }

  // End → nothing
  addRelation(endId, [], null);

  // Start → Once
  addRelation(startId, [], onceId);

  return { nodes, relations };
}

module.exports = { buildFlow };
