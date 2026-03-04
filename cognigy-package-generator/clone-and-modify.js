/**
 * Clone a working Cognigy package and rebuild with new content and tools.
 * Uses real nodes as templates to guarantee exact JSON structure Cognigy expects.
 * Supports any number of tools (not limited to source package's tool count).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

/**
 * Generate IDs following Cognigy's ObjectId pattern.
 * All IDs share the same timestamp + random prefix with incrementing counter.
 */
function generateIdSet(count) {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = crypto.randomBytes(5).toString("hex");
  const ids = [];
  for (let i = 0; i < count; i++) {
    ids.push(timestamp + random + i.toString(16).padStart(6, "0"));
  }
  return ids;
}

/**
 * Clone a working package and rebuild with new content.
 *
 * @param {string} sourceDir - Path to extracted working package
 * @param {object} spec - What to change:
 *   spec.flowName - New flow name
 *   spec.description - Package description
 *   spec.instructionsCode - JS code for Instructions node (sets context.instructions)
 *   spec.knowledgeCode - JS code for FAQ/Knowledge node (sets context.knowledge)
 *   spec.agentJobConfig - { name, description, instructions } for AI Agent Job
 *   spec.tools - Array of tool definitions:
 *     { toolId, label, description, useParameters, parameters, code, answer }
 * @param {string} outputPath - Where to write the ZIP
 */
function cloneAndModify(sourceDir, spec, outputPath) {
  // 1. Read all source files
  const src = {};
  function readDir(dir, prefix) {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const relPath = prefix ? prefix + "/" + entry : entry;
      if (fs.statSync(fullPath).isDirectory()) {
        readDir(fullPath, relPath);
      } else {
        src[relPath] = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      }
    }
  }
  readDir(sourceDir, "");

  // 2. Identify source resource IDs
  const srcLocaleId = Object.keys(src).filter(k => k.startsWith("locale/"))[0].split("/")[1];
  const srcFlowId = Object.keys(src).filter(k => k.startsWith("flow/"))[0].split("/")[1];
  const srcChartId = Object.keys(src).filter(k => k.startsWith("chart/"))[0].split("/")[1];
  const srcFlowStateId = Object.keys(src).filter(k => k.startsWith("flowState/"))[0].split("/")[1];
  const srcFlowSettingsId = Object.keys(src).filter(k => k.startsWith("flowSettings/"))[0].split("/")[1];
  const srcItgId = Object.keys(src).filter(k => k.startsWith("intentTrainGroup/"))[0].split("/")[1];

  // 3. Index source nodes by type
  const srcNodesByType = {};
  for (const key of Object.keys(src).filter(k => k.startsWith("nodeData/"))) {
    const node = src[key];
    if (!srcNodesByType[node.type]) srcNodesByType[node.type] = [];
    srcNodesByType[node.type].push(node);
  }

  // Find template nodes (first match of each type)
  const tmpl = (type, label) => {
    const nodes = srcNodesByType[type] || [];
    if (label) return nodes.find(n => n.label === label) || nodes[0];
    return nodes[0];
  };

  // 4. Calculate total IDs needed
  const toolCount = spec.tools ? spec.tools.length : 0;
  const xAppToolCount = spec.tools ? spec.tools.filter(t => t.xApp).length : 0;
  const regularToolCount = toolCount - xAppToolCount;
  // Resources: flow, chart, flowState, flowSettings, ITG = 5
  // Skeleton nodes: start, once, onFirst, afterwards, end, setSessionConfig, instructions, faq, aiAgentJob, default = 10
  // Tool nodes: 3 per regular tool (tool, code, answer), 6 per xApp tool (tool, code, initApp, sendSMS, showHTML, answer)
  // Chart relations: 10 skeleton + 3 per regular tool + 6 per xApp tool
  const totalIds = 5 + 10 + (regularToolCount * 3) + (xAppToolCount * 6) + 10 + (regularToolCount * 3) + (xAppToolCount * 6);
  const allIds = generateIdSet(totalIds);
  let idx = 0;

  // Flow-level resource IDs
  const newFlowId = allIds[idx++];
  const newChartId = allIds[idx++];
  const newFlowStateId = allIds[idx++];
  const newFlowSettingsId = allIds[idx++];
  const newItgId = allIds[idx++];

  // Skeleton node IDs
  const nid = {
    start: allIds[idx++],
    once: allIds[idx++],
    onFirst: allIds[idx++],
    afterwards: allIds[idx++],
    end: allIds[idx++],
    setSession: allIds[idx++],
    instructions: allIds[idx++],
    faq: allIds[idx++],
    aiAgentJob: allIds[idx++],
    default: allIds[idx++],
  };

  // Tool node IDs (3 per regular tool, 6 per xApp tool)
  const toolNodeIds = [];
  for (let i = 0; i < toolCount; i++) {
    const isXApp = spec.tools[i].xApp;
    if (isXApp) {
      toolNodeIds.push({
        tool: allIds[idx++],
        code: allIds[idx++],
        initApp: allIds[idx++],
        sendSMS: allIds[idx++],
        showHTML: allIds[idx++],
        answer: allIds[idx++],
      });
    } else {
      toolNodeIds.push({
        tool: allIds[idx++],
        code: allIds[idx++],
        answer: allIds[idx++],
      });
    }
  }

  // Chart relation IDs
  const rid = {
    start: allIds[idx++],
    once: allIds[idx++],
    onFirst: allIds[idx++],
    afterwards: allIds[idx++],
    setSession: allIds[idx++],
    faq: allIds[idx++],
    instructions: allIds[idx++],
    aiAgentJob: allIds[idx++],
    default: allIds[idx++],
    end: allIds[idx++],
  };
  const toolRelIds = [];
  for (let i = 0; i < toolCount; i++) {
    const isXApp = spec.tools[i].xApp;
    if (isXApp) {
      toolRelIds.push({
        tool: allIds[idx++],
        code: allIds[idx++],
        initApp: allIds[idx++],
        sendSMS: allIds[idx++],
        showHTML: allIds[idx++],
        answer: allIds[idx++],
      });
    } else {
      toolRelIds.push({
        tool: allIds[idx++],
        code: allIds[idx++],
        answer: allIds[idx++],
      });
    }
  }

  // 5. Helper: deep-clone a node template with new IDs and references
  const projectRef = src["flow/" + srcFlowId].projectReference;
  const orgRef = src["flow/" + srcFlowId].organisationReference;

  function cloneNode(template, newNodeId) {
    const node = JSON.parse(JSON.stringify(template));
    node._id = newNodeId;
    node.referenceId = crypto.randomUUID();
    node.chartReference = newChartId;
    node.resourceReference = newFlowId;
    node.projectReference = projectRef;
    node.organisationReference = orgRef;
    if (node.localizedData) {
      for (const ld of node.localizedData) {
        ld.localeReference = srcLocaleId;
      }
    }
    return node;
  }

  const outputFiles = {};

  // 6. Copy shared resources as-is (locale, aiAgent, connection)
  for (const key of Object.keys(src)) {
    if (key.startsWith("locale/") || key.startsWith("aiAgent/") || key.startsWith("connection/")) {
      outputFiles[key] = JSON.parse(JSON.stringify(src[key]));
    }
  }

  // 7. Build skeleton nodes
  const nodeStart = cloneNode(tmpl("start"), nid.start);
  const nodeOnce = cloneNode(tmpl("once"), nid.once);
  const nodeOnFirst = cloneNode(tmpl("onFirstExecution"), nid.onFirst);
  const nodeAfterwards = cloneNode(tmpl("afterwards"), nid.afterwards);
  const nodeEnd = cloneNode(tmpl("end"), nid.end);
  const nodeSetSession = cloneNode(tmpl("setSessionConfig"), nid.setSession);
  const nodeInstructions = cloneNode(tmpl("code", "Instructions"), nid.instructions);
  const nodeFAQ = cloneNode(tmpl("code", "FAQ"), nid.faq);
  const nodeAiAgentJob = cloneNode(tmpl("aiAgentJob"), nid.aiAgentJob);
  const nodeDefault = cloneNode(tmpl("aiAgentJobDefault"), nid.default);

  // 8. Apply content modifications to skeleton nodes

  // Instructions code node
  if (spec.instructionsCode) {
    const cfg = nodeInstructions.localizedData[0].config;
    cfg.code = spec.instructionsCode;
    cfg.hasError = false;
    cfg.transpiled = spec.instructionsCode;
  }

  // FAQ/Knowledge code node
  if (spec.knowledgeCode) {
    const cfg = nodeFAQ.localizedData[0].config;
    cfg.code = spec.knowledgeCode;
    cfg.hasError = false;
    cfg.transpiled = spec.knowledgeCode;
  }

  // AI Agent Job config
  if (spec.agentJobConfig) {
    const cfg = nodeAiAgentJob.localizedData[0].config;
    if (spec.agentJobConfig.name) cfg.name = spec.agentJobConfig.name;
    if (spec.agentJobConfig.description) cfg.description = spec.agentJobConfig.description;
    if (spec.agentJobConfig.instructions !== undefined) cfg.instructions = spec.agentJobConfig.instructions;
  }

  // Write skeleton nodes
  outputFiles["nodeData/" + nid.start] = nodeStart;
  outputFiles["nodeData/" + nid.once] = nodeOnce;
  outputFiles["nodeData/" + nid.onFirst] = nodeOnFirst;
  outputFiles["nodeData/" + nid.afterwards] = nodeAfterwards;
  outputFiles["nodeData/" + nid.end] = nodeEnd;
  outputFiles["nodeData/" + nid.setSession] = nodeSetSession;
  outputFiles["nodeData/" + nid.instructions] = nodeInstructions;
  outputFiles["nodeData/" + nid.faq] = nodeFAQ;
  outputFiles["nodeData/" + nid.aiAgentJob] = nodeAiAgentJob;
  outputFiles["nodeData/" + nid.default] = nodeDefault;

  // 9. Build tool branches
  //    Regular: aiAgentJobTool → code → aiAgentToolAnswer (3 nodes)
  //    xApp:    aiAgentJobTool → code → initAppSession → sendSMS → setHTMLAppState → aiAgentToolAnswer (6 nodes)
  const toolTemplate = tmpl("aiAgentJobTool");
  const codeTemplate = tmpl("code", "Auth") || tmpl("code"); // prefer simple code node
  const answerTemplate = tmpl("aiAgentToolAnswer");
  const initAppTemplate = tmpl("initAppSession");
  const sendSMSTemplate = tmpl("sendSMS");
  const showHTMLTemplate = tmpl("setHTMLAppState");

  for (let i = 0; i < toolCount; i++) {
    const ts = spec.tools[i];
    const tids = toolNodeIds[i];

    // Tool node (same for both regular and xApp)
    const toolNode = cloneNode(toolTemplate, tids.tool);
    toolNode.label = ts.label || "Tool";
    const tcfg = toolNode.localizedData[0].config;
    tcfg.toolId = ts.toolId;
    tcfg.description = ts.description || "";
    tcfg.useParameters = ts.useParameters !== undefined ? ts.useParameters : true;
    tcfg.parameters = typeof ts.parameters === "string"
      ? ts.parameters
      : JSON.stringify(ts.parameters || {}, null, "\t");
    toolNode.localizedData[0].preview = ts.toolId;
    outputFiles["nodeData/" + tids.tool] = toolNode;

    // Code node for this tool (same for both)
    const codeNode = cloneNode(codeTemplate, tids.code);
    codeNode.label = ts.label ? ts.label : "Tool Logic";
    const codeContent = ts.code || "";
    codeNode.localizedData[0].config.code = codeContent;
    if (codeContent) {
      codeNode.localizedData[0].config.hasError = false;
      codeNode.localizedData[0].config.transpiled = codeContent;
    } else {
      // Empty code: remove hasError/transpiled if present (match source pattern)
      delete codeNode.localizedData[0].config.hasError;
      delete codeNode.localizedData[0].config.transpiled;
    }
    codeNode.localizedData[0].preview = "";
    outputFiles["nodeData/" + tids.code] = codeNode;

    // xApp tools: add initAppSession → sendSMS → setHTMLAppState nodes
    if (ts.xApp) {
      // initAppSession node
      const initAppNode = cloneNode(initAppTemplate, tids.initApp);
      initAppNode.label = "xApp: Init Session";
      const initCfg = initAppNode.localizedData[0].config;
      if (ts.xApp.logoUrl) initCfg.logoUrl = ts.xApp.logoUrl;
      if (ts.xApp.backgroundColor) initCfg.backgroundColor = ts.xApp.backgroundColor;
      outputFiles["nodeData/" + tids.initApp] = initAppNode;

      // sendSMS node
      const smsNode = cloneNode(sendSMSTemplate, tids.sendSMS);
      smsNode.label = "Send SMS";
      const smsCfg = smsNode.localizedData[0].config;
      if (spec.sms) {
        if (spec.sms.from) smsCfg.from = spec.sms.from;
        if (spec.sms.to) smsCfg.to = spec.sms.to;
      }
      // body is always the xApp Session URL snippet — keep from template
      outputFiles["nodeData/" + tids.sendSMS] = smsNode;

      // setHTMLAppState node
      const showHTMLNode = cloneNode(showHTMLTemplate, tids.showHTML);
      showHTMLNode.label = "xApp: Show HTML";
      const htmlCfg = showHTMLNode.localizedData[0].config;
      if (ts.xApp.html) htmlCfg.body = ts.xApp.html;
      outputFiles["nodeData/" + tids.showHTML] = showHTMLNode;
    }

    // Answer node (same for both)
    const answerNode = cloneNode(answerTemplate, tids.answer);
    const answer = ts.answer || "Action completed.";
    answerNode.localizedData[0].config.answer = answer;
    answerNode.localizedData[0].preview = answer.substring(0, 200);
    outputFiles["nodeData/" + tids.answer] = answerNode;
  }

  // 10. Build chart with all relations
  //
  // Flow structure:
  //   Start → Once → [children: OnFirst, Afterwards] → AI Agent Job → End
  //   OnFirst → SetSessionConfig → FAQ → Instructions → (null)
  //   Afterwards → (null)
  //   AI Agent Job → [children: Default, Tool1, Tool2, ...] → End
  //   Regular tool: Tool → Code → Answer → (null)
  //   xApp tool:    Tool → Code → InitApp → SendSMS → ShowHTML → Answer → (null)
  //
  const relations = [
    { node: nid.start, children: [], next: nid.once, _id: rid.start },
    { node: nid.once, children: [nid.onFirst, nid.afterwards], next: nid.aiAgentJob, _id: rid.once },
    { node: nid.onFirst, children: [], next: nid.setSession, _id: rid.onFirst },
    { node: nid.afterwards, children: [], next: null, _id: rid.afterwards },
    { node: nid.setSession, children: [], next: nid.faq, _id: rid.setSession },
    { node: nid.faq, children: [], next: nid.instructions, _id: rid.faq },
    { node: nid.instructions, children: [], next: null, _id: rid.instructions },
    { node: nid.aiAgentJob, children: [nid.default, ...toolNodeIds.map(t => t.tool)], next: nid.end, _id: rid.aiAgentJob },
    { node: nid.default, children: [], next: null, _id: rid.default },
    { node: nid.end, children: [], next: null, _id: rid.end },
  ];

  for (let i = 0; i < toolCount; i++) {
    const tids = toolNodeIds[i];
    const trids = toolRelIds[i];
    const isXApp = spec.tools[i].xApp;
    if (isXApp) {
      // xApp chain: tool → code → initApp → sendSMS → showHTML → answer → null
      relations.push(
        { node: tids.tool, children: [], next: tids.code, _id: trids.tool },
        { node: tids.code, children: [], next: tids.initApp, _id: trids.code },
        { node: tids.initApp, children: [], next: tids.sendSMS, _id: trids.initApp },
        { node: tids.sendSMS, children: [], next: tids.showHTML, _id: trids.sendSMS },
        { node: tids.showHTML, children: [], next: tids.answer, _id: trids.showHTML },
        { node: tids.answer, children: [], next: null, _id: trids.answer },
      );
    } else {
      // Regular chain: tool → code → answer → null
      relations.push(
        { node: tids.tool, children: [], next: tids.code, _id: trids.tool },
        { node: tids.code, children: [], next: tids.answer, _id: trids.code },
        { node: tids.answer, children: [], next: null, _id: trids.answer },
      );
    }
  }

  outputFiles["chart/" + newChartId] = {
    _id: newChartId,
    relations,
    resourceReference: newFlowId,
    projectReference: projectRef,
    organisationReference: orgRef,
  };

  // 11. Build flow
  const srcFlow = src["flow/" + srcFlowId];
  const flow = JSON.parse(JSON.stringify(srcFlow));
  flow._id = newFlowId;
  flow.referenceId = crypto.randomUUID();
  flow.name = spec.flowName || flow.name;
  flow.chartReference = newChartId;
  flow.createdAt = Math.floor(Date.now() / 1000);
  flow.lastChanged = Math.floor(Date.now() / 1000);
  flow.localizedData[0].localeReference = srcLocaleId;
  outputFiles["flow/" + newFlowId] = flow;

  // 12. Build flowState
  const srcFS = src["flowState/" + srcFlowStateId];
  const flowState = JSON.parse(JSON.stringify(srcFS));
  flowState._id = newFlowStateId;
  flowState.referenceId = crypto.randomUUID();
  flowState.flowReference = newFlowId;
  flowState.createdAt = Math.floor(Date.now() / 1000);
  flowState.lastChanged = Math.floor(Date.now() / 1000);
  outputFiles["flowState/" + newFlowStateId] = flowState;

  // 13. Build flowSettings
  const srcFSet = src["flowSettings/" + srcFlowSettingsId];
  const flowSettings = JSON.parse(JSON.stringify(srcFSet));
  flowSettings._id = newFlowSettingsId;
  flowSettings.flowReference = newFlowId;
  outputFiles["flowSettings/" + newFlowSettingsId] = flowSettings;

  // 14. Build intentTrainGroup
  const srcItg = src["intentTrainGroup/" + srcItgId];
  const itg = JSON.parse(JSON.stringify(srcItg));
  itg._id = newItgId;
  itg.referenceId = crypto.randomUUID();
  itg.flowReference = newFlowId;
  itg.lastChanged = Math.floor(Date.now() / 1000);
  if (itg.lastRelevantChangeAt) itg.lastRelevantChangeAt = Math.floor(Date.now() / 1000);
  outputFiles["intentTrainGroup/" + newItgId] = itg;

  // 15. Build index.json
  const flowName = spec.flowName || "Demo Package";
  const ts = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
  outputFiles["index.json"] = {
    cognigyVersion: src["index.json"].cognigyVersion,
    type: "package",
    createdAt: new Date().toISOString(),
    name: flowName + "_" + ts,
    description: spec.description || "",
    resourcesHash: crypto.randomBytes(20).toString("hex"),
  };

  // 16. Write ZIP
  const tmpDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "cognigy-clone-"));
  try {
    for (const [relPath, data] of Object.entries(outputFiles)) {
      const fullPath = path.join(tmpDir, relPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, JSON.stringify(data));
    }

    const absOutput = path.resolve(outputPath);
    if (fs.existsSync(absOutput)) fs.unlinkSync(absOutput);
    // Use -D to skip directory entries (Cognigy expects flat file paths only)
    execSync(`cd "${tmpDir}" && find . -type f | sed 's|^\\./||' | zip -D -@ "${absOutput}"`, { stdio: "pipe" });

    // Print summary
    console.log("\nPackage created: " + absOutput);
    const dirs = {};
    for (const key of Object.keys(outputFiles)) {
      const dir = key.includes("/") ? key.split("/")[0] : "(root)";
      dirs[dir] = (dirs[dir] || 0) + 1;
    }
    console.log("Files:");
    for (const [dir, count] of Object.entries(dirs).sort()) {
      console.log("  " + dir + ": " + count);
    }
    console.log("  Total: " + Object.keys(outputFiles).length);
    console.log("Tools: " + toolCount + (xAppToolCount > 0 ? " (" + xAppToolCount + " xApp)" : ""));

    return absOutput;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

module.exports = { cloneAndModify };
