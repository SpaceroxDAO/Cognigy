const fs = require("fs");
const path = require("path");

const base = "/tmp/verify-pkg";

const localeFile = fs.readdirSync(path.join(base, "locale"))[0];
const locale = JSON.parse(fs.readFileSync(path.join(base, "locale", localeFile), "utf8"));
const flowFile = fs.readdirSync(path.join(base, "flow"))[0];
const flow = JSON.parse(fs.readFileSync(path.join(base, "flow", flowFile), "utf8"));
const chartFile = fs.readdirSync(path.join(base, "chart"))[0];
const chart = JSON.parse(fs.readFileSync(path.join(base, "chart", chartFile), "utf8"));
const aiAgentFile = fs.readdirSync(path.join(base, "aiAgent"))[0];
const aiAgent = JSON.parse(fs.readFileSync(path.join(base, "aiAgent", aiAgentFile), "utf8"));

console.log("=== Cross-Reference Validation ===\n");

// 1. File names match _id fields
console.log("1. File name == _id:");
console.log("  locale:", localeFile === locale._id ? "OK" : "FAIL");
console.log("  flow:", flowFile === flow._id ? "OK" : "FAIL");
console.log("  chart:", chartFile === chart._id ? "OK" : "FAIL");
console.log("  aiAgent:", aiAgentFile === aiAgent._id ? "OK" : "FAIL");

// 2. Flow references
console.log("\n2. Flow references:");
console.log("  flow.chartReference == chart._id:", flow.chartReference === chart._id ? "OK" : "FAIL");
console.log("  chart.resourceReference == flow._id:", chart.resourceReference === flow._id ? "OK" : "FAIL");
console.log("  flow.localizedData[0].localeReference == locale._id:",
  flow.localizedData[0].localeReference === locale._id ? "OK" : "FAIL");

// 3. Node data references
const nodeDir = path.join(base, "nodeData");
const nodeFiles = fs.readdirSync(nodeDir);
let nodeOk = true;
const nodeCount = { total: 0, types: {} };
for (const nf of nodeFiles) {
  const node = JSON.parse(fs.readFileSync(path.join(nodeDir, nf), "utf8"));
  nodeCount.total++;
  nodeCount.types[node.type] = (nodeCount.types[node.type] || 0) + 1;
  if (nf !== node._id) { console.log("  FAIL: filename != _id for", nf); nodeOk = false; }
  if (node.chartReference !== chart._id) { console.log("  FAIL: chartReference for", node.label); nodeOk = false; }
  if (node.resourceReference !== flow._id) { console.log("  FAIL: resourceReference for", node.label); nodeOk = false; }
  if (node.localizedData[0].localeReference !== locale._id) { console.log("  FAIL: localeReference for", node.label); nodeOk = false; }
}
console.log("\n3. Node data references:", nodeOk ? "ALL OK" : "SOME FAILURES");
console.log("  Total nodes:", nodeCount.total);
console.log("  By type:", JSON.stringify(nodeCount.types, null, 4));

// 4. Chart relations reference valid nodes
const nodeIds = new Set(nodeFiles);
let chartOk = true;
for (const rel of chart.relations) {
  if (!nodeIds.has(rel.node)) { console.log("  FAIL: chart relation references unknown node:", rel.node); chartOk = false; }
  for (const child of rel.children) {
    if (!nodeIds.has(child)) { console.log("  FAIL: chart child references unknown node:", child); chartOk = false; }
  }
  if (rel.next && !nodeIds.has(rel.next)) { console.log("  FAIL: chart next references unknown node:", rel.next); chartOk = false; }
}
console.log("\n4. Chart relations reference valid nodes:", chartOk ? "ALL OK" : "SOME FAILURES");
console.log("  Relations count:", chart.relations.length);

// 5. FlowState/FlowSettings/IntentTrainGroup
const fsFile = fs.readdirSync(path.join(base, "flowState"))[0];
const fState = JSON.parse(fs.readFileSync(path.join(base, "flowState", fsFile), "utf8"));
const fsettFile = fs.readdirSync(path.join(base, "flowSettings"))[0];
const fSett = JSON.parse(fs.readFileSync(path.join(base, "flowSettings", fsettFile), "utf8"));
const itgFile = fs.readdirSync(path.join(base, "intentTrainGroup"))[0];
const itg = JSON.parse(fs.readFileSync(path.join(base, "intentTrainGroup", itgFile), "utf8"));

console.log("\n5. Support files:");
console.log("  flowState.flowReference == flow._id:", fState.flowReference === flow._id ? "OK" : "FAIL");
console.log("  flowSettings.flowReference == flow._id:", fSett.flowReference === flow._id ? "OK" : "FAIL");
console.log("  intentTrainGroup.flowReference == flow._id:", itg.flowReference === flow._id ? "OK" : "FAIL");

// 6. AI Agent referenced in AI Agent Job
const aiJobNode = nodeFiles.map(f => JSON.parse(fs.readFileSync(path.join(nodeDir, f), "utf8")))
  .find(n => n.type === "aiAgentJob");
console.log("\n6. AI Agent Job references:");
console.log("  aiAgentJob.config.aiAgent == aiAgent.referenceId:",
  aiJobNode.localizedData[0].config.aiAgent === aiAgent.referenceId ? "OK" : "FAIL");

console.log("\n=== VALIDATION COMPLETE ===");
