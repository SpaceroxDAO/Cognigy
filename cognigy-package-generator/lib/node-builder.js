const { generateObjectId, generateUUID } = require("./id-generator");

function createBaseNode(type, label, chartRef, flowRef, localeRef, projectRef, orgRef, config = {}) {
  return {
    _id: generateObjectId(),
    referenceId: generateUUID(),
    type,
    label,
    comment: "",
    commentColor: "",
    analyticsLabel: null,
    isDisabled: false,
    isEntryPoint: type === "start",
    localizedData: [
      {
        config,
        preview: "",
        localeReference: localeRef,
      },
    ],
    chartReference: chartRef,
    extension: "@cognigy/basic-nodes",
    resourceReference: flowRef,
    projectReference: projectRef,
    organisationReference: orgRef,
  };
}

function createStartNode(chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("start", "Start", chartRef, flowRef, localeRef, projectRef, orgRef);
}

function createEndNode(chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("end", "End", chartRef, flowRef, localeRef, projectRef, orgRef);
}

function createOnceNode(chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("once", "Once", chartRef, flowRef, localeRef, projectRef, orgRef);
}

function createOnFirstExecutionNode(chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("onFirstExecution", "On First Execution", chartRef, flowRef, localeRef, projectRef, orgRef);
}

function createAfterwardsNode(chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("afterwards", "Afterwards", chartRef, flowRef, localeRef, projectRef, orgRef);
}

function createCodeNode(label, code, chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("code", label, chartRef, flowRef, localeRef, projectRef, orgRef, {
    code,
  });
}

function createSayNode(label, text, chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("say", label, chartRef, flowRef, localeRef, projectRef, orgRef, {
    text,
    data: "",
  });
}

function createSetSessionConfigNode(label, voiceConfig, chartRef, flowRef, localeRef, projectRef, orgRef) {
  const defaults = require("./defaults").DEFAULT_VOICE_CONFIG;
  const vc = { ...defaults, ...voiceConfig };
  return createBaseNode("setSessionConfig", label, chartRef, flowRef, localeRef, projectRef, orgRef, {
    setSessionConfigSetting: "speechParameters",
    sttVendor: vc.sttVendor,
    sttLanguage: vc.sttLanguage,
    sttModel: vc.sttModel,
    ttsVendor: vc.ttsVendor,
    ttsVoice: vc.ttsVoice || "",
    ttsLanguage: vc.ttsLanguage,
    ttsModel: vc.ttsModel,
    bargeIn: vc.bargeIn,
    endpointing: vc.endpointing,
    noInputTimeout: vc.noInputTimeout,
    dtmfEnable: vc.dtmfEnable,
    continuousBridging: false,
  });
}

function createAiAgentJobNode(config, chartRef, flowRef, localeRef, projectRef, orgRef) {
  const defaults = require("./defaults").DEFAULT_AI_AGENT_JOB_CONFIG;
  const mergedConfig = { ...defaults, ...config };
  return createBaseNode("aiAgentJob", "AI Agent", chartRef, flowRef, localeRef, projectRef, orgRef, mergedConfig);
}

function createAiAgentJobDefaultNode(chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("aiAgentJobDefault", "Default", chartRef, flowRef, localeRef, projectRef, orgRef);
}

function createAiAgentJobToolNode(label, toolConfig, chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("aiAgentJobTool", label, chartRef, flowRef, localeRef, projectRef, orgRef, {
    toolId: toolConfig.toolId,
    description: toolConfig.description,
    useParameters: toolConfig.useParameters !== undefined ? toolConfig.useParameters : true,
    parameters: typeof toolConfig.parameters === "string"
      ? toolConfig.parameters
      : JSON.stringify(toolConfig.parameters, null, 2),
    debugMessage: true,
    condition: toolConfig.condition || "",
  });
}

function createResolveToolActionNode(answer, chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("aiAgentToolAnswer", "Resolve Tool Action", chartRef, flowRef, localeRef, projectRef, orgRef, {
    answer,
    debugToolAnswer: false,
  });
}

function createPlaceholderNode(label, text, chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("placeholder", label, chartRef, flowRef, localeRef, projectRef, orgRef, {
    text: text || "Handle the action here",
    data: "",
  });
}

function createAddToContextNode(label, key, value, chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("addToContext", label, chartRef, flowRef, localeRef, projectRef, orgRef, {
    key,
    value,
    mode: "simple",
  });
}

function createSleepNode(seconds, chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("sleep", "Sleep", chartRef, flowRef, localeRef, projectRef, orgRef, {
    amount: seconds,
  });
}

function createHangupNode(chartRef, flowRef, localeRef, projectRef, orgRef) {
  return createBaseNode("hangup", "Hang Up", chartRef, flowRef, localeRef, projectRef, orgRef);
}

module.exports = {
  createBaseNode,
  createStartNode,
  createEndNode,
  createOnceNode,
  createOnFirstExecutionNode,
  createAfterwardsNode,
  createCodeNode,
  createSayNode,
  createSetSessionConfigNode,
  createAiAgentJobNode,
  createAiAgentJobDefaultNode,
  createAiAgentJobToolNode,
  createResolveToolActionNode,
  createPlaceholderNode,
  createAddToContextNode,
  createSleepNode,
  createHangupNode,
};
