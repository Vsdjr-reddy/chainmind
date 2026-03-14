const OR_KEY = import.meta.env.VITE_OPENROUTER_KEY;
const TV_KEY = import.meta.env.VITE_TAVILY_KEY;

async function callLLM(messages, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OR_KEY}`,
      "HTTP-Referer": "https://chainmind.app",
      "X-Title": "ChainMind"
    },
    body: JSON.stringify({
      model: "openrouter/auto",
      max_tokens: 1000,
      system: systemPrompt,
      messages
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "API error");
  const block = data.content?.find(b => b.type === "text");
  return block?.text || "";
}

export async function runPlanner(goal) {
  return callLLM(
    [{ role: "user", content: `Goal: ${goal}\n\nBreak this into 4-5 clear research sub-tasks. Be specific and concise.` }],
    "You are a planning agent. Output a numbered list of sub-tasks only. No preamble."
  );
}

export async function runResearch(goal, plan) {
  let webContext = "";
  try {
    const tv = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: TV_KEY, query: goal, max_results: 5 })
    });
    const tvData = await tv.json();
    webContext = tvData.results?.map(r => `${r.title}: ${r.content}`).join("\n\n") || "";
  } catch (e) { webContext = "Web search unavailable."; }

  return callLLM(
    [{ role: "user", content: `Goal: ${goal}\n\nPlan:\n${plan}\n\nWeb results:\n${webContext}\n\nSummarise key findings.` }],
    "You are a research agent. Extract and summarise the most relevant findings. Be factual and concise."
  );
}

export async function runExecution(goal, plan, research) {
  return callLLM(
    [{ role: "user", content: `Goal: ${goal}\n\nResearch:\n${research}\n\nExtract exactly 5 numbered data points with specific facts and metrics.` }],
    "You are an execution agent. Output exactly 5 numbered data points. Each must contain a specific fact or metric. No vague statements."
  );
}

export async function runVerification(goal, research, execution) {
  return callLLM(
    [{ role: "user", content: `Goal: ${goal}\n\nResearch:\n${research}\n\nExecution output:\n${execution}\n\nScore the execution output 0-100 for accuracy and completeness. List any issues.` }],
    "You are a verification agent. Output: SCORE: X/100, then ISSUES: (list or 'none'), then VERDICT: APPROVED or NEEDS_REVIEW."
  );
}

export async function runMemory(goal, allOutputs) {
  return callLLM(
    [{ role: "user", content: `Goal: ${goal}\n\nAll outputs:\n${allOutputs}\n\nExtract 3-5 key facts worth remembering for future runs.` }],
    "You are a memory agent. Output a numbered list of key facts to store. Be concise."
  );
}

export async function runReport(goal, plan, research, execution, verification) {
  return callLLM(
    [{ role: "user", content: `Goal: ${goal}\n\nPlan:\n${plan}\n\nResearch:\n${research}\n\nData points:\n${execution}\n\nVerification:\n${verification}\n\nWrite a structured intelligence briefing.` }],
    "You are a report agent. Write a clear, structured report with: Executive Summary, Key Findings, Analysis, and Conclusion."
  );
}