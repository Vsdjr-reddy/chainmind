// ─────────────────────────────────────────────────────────────────────────────
//  ChainMind v9 · api.js  (built on working v6 base)
//  Drop into: src/api.js
//  .env:
//    VITE_OPENROUTER_KEY=sk-or-v1-xxxx
//    VITE_TAVILY_KEY=tvly-xxxx
// ─────────────────────────────────────────────────────────────────────────────

const OR_KEY  = import.meta.env.VITE_OPENROUTER_KEY;
const TAV_KEY = import.meta.env.VITE_TAVILY_KEY;

const FREE_ROUTER = "openrouter/free";

// ─── Core LLM caller (unchanged from v6) ─────────────────────────────────────
export async function callLLM(tier, systemPrompt, userPrompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OR_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chainmind.app",
      "X-Title": "ChainMind",
    },
    body: JSON.stringify({
      model: FREE_ROUTER,
      messages: [
        { role: "system", content: "IMPORTANT: Output ONLY your final answer. No thinking, no reasoning, no preamble, no 'Okay let me...' or 'First I will...'. Start directly with the answer.\n\n" + systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  console.log("=== OpenRouter raw response ===", JSON.stringify(data, null, 2));

  const msg = data?.choices?.[0]?.message;
  const text =
    msg?.content ||
    msg?.reasoning ||
    msg?.reasoning_details?.[0]?.text ||
    data?.choices?.[0]?.text ||
    null;

  if (!text) {
    console.error("Unexpected OpenRouter response shape:", JSON.stringify(data));
    throw new Error(`Unexpected response format. Raw: ${JSON.stringify(data).substring(0, 200)}`);
  }

  const cleaned = text
    .replace(/^(okay|alright|sure|let me|first|let's|i need to|i'll|i will)[^\n]*\n/gim, "")
    .replace(/^(thinking:|reasoning:|<think>)[\s\S]*?(<\/think>|\n\n)/im, "")
    .trim();

  return cleaned || text.trim();
}

// ─── Web search via Tavily (unchanged from v6) ───────────────────────────────
export async function webSearch(query) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAV_KEY,
      query,
      max_results: 5,
      search_depth: "basic",
      include_answer: true,
    }),
  });

  if (!res.ok) {
    console.warn("Tavily search failed, continuing without web results");
    return "Web search unavailable. Proceeding with internal knowledge.";
  }

  const data = await res.json();
  const results = (data.results || [])
    .map((r, i) => `[Source ${i + 1}] ${r.title}\n${r.content}`)
    .join("\n\n");

  return data.answer
    ? `Quick Answer: ${data.answer}\n\nDetailed Sources:\n${results}`
    : results || "No results found.";
}

// ─────────────────────────────────────────────────────────────────────────────
//  AGENT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. PLANNER ────────────────────────────────────────────────────────────────
// v9: detects org project mode (TEAM MEMBERS: present) and switches prompt
export async function runPlanner(goal) {
  const isOrgProject = goal.includes("TEAM MEMBERS:");

  const systemPrompt = isOrgProject
    ? `You are ChainMind's Planner Agent managing an organizational project.
Your job is to decompose the project into sub-tasks and assign each to the most suitable team member.

Rules:
- Return exactly 5-6 numbered sub-tasks
- For each sub-task, explicitly name the assigned employee and reason why
- Consider both skill match AND current workload when assigning
- Format each line as: N. [TASK]: Assigned to [NAME] ([ROLE]) — Reason: [brief reason]
- Order tasks logically by dependency
- Do NOT include preamble, just the numbered assignment list`
    : `You are ChainMind's Planner Agent. Your job is to decompose a user's goal
into a precise, actionable execution plan.

Rules:
- Return exactly 5 numbered sub-tasks
- Each task must be specific and independently executable
- Order tasks logically (research before execution, etc.)
- Keep each task to one clear sentence
- Do NOT include any preamble or explanation, just the numbered list`;

  const output = await callLLM("frontier", systemPrompt, `Goal: ${goal}`);
  return output;
}

// ── 2. RESEARCH (unchanged from v6) ──────────────────────────────────────────
export async function runResearch(goal, taskPlan) {
  const searchResults = await webSearch(goal);

  const output = await callLLM(
    "mid",
    `You are ChainMind's Research Agent. You have access to web search results.
Your job is to extract and summarise the most relevant information for the task.

Rules:
- Cite sources as [Source N] where relevant
- Focus on factual, verifiable information
- Highlight any conflicting information you find
- Keep your summary to 200-300 words
- Structure with: Key Findings, Important Facts, Data Points`,
    `Goal: ${goal}

Task Plan:
${taskPlan}

Web Search Results:
${searchResults}`
  );

  return output;
}

// ── 3. EXECUTION (unchanged from v6) ─────────────────────────────────────────
export async function runExecution(goal, taskPlan, research) {
  const output = await callLLM(
    "slm",
    `You are ChainMind's Execution Agent. You process and structure research data.
Your job is to extract concrete, usable outputs from research findings.

Rules:
- Extract EXACTLY 5 key data points as a numbered list — no more, no fewer
- Number them 1 through 5 only
- Each point must be a specific fact, metric, or actionable insight
- Convert any vague claims into concrete statements
- Flag any data that seems unreliable with [LOW CONFIDENCE]
- Stop at point 5 — do not add a 6th point under any circumstances
- No preamble, just the structured output`,
    `Goal: ${goal}

Task Plan:
${taskPlan}

Research Findings:
${research}`
  );

  return output;
}

// ── 4. VERIFICATION (unchanged from v6) ──────────────────────────────────────
function normaliseVerification(raw) {
  const clean = (s) => {
    if (!s) return null;
    const trimmed = s.replace(/\n/g, " ").trim();
    if (/^\[.*\]$/.test(trimmed)) return null;
    return trimmed.replace(/\[.*?\]/g, "").trim().substring(0, 200) || null;
  };

  const scoreMatch  = raw.match(/CONFIDENCE_SCORE[:\s]+(\d+)/i);
  const issuesMatch = raw.match(/ISSUES_FOUND[:\s]+(\d+)/i);
  // Floor at 40 — a 0 score from a pure format quirk (6 points vs 5) is misleading
  const score   = scoreMatch  ? Math.max(40, parseInt(scoreMatch[1]))  : 70;
  const issues  = issuesMatch ? parseInt(issuesMatch[1]) : 1;

  const hasApproved    = /\bAPPROVED\b/i.test(raw);
  const hasNeedsReview = /NEEDS[_\s]REVIEW/i.test(raw);
  const verdict = (hasApproved && !hasNeedsReview) ? "APPROVED" : "NEEDS_REVIEW";

  const issueLines = ["NONE", "NONE", "NONE"];
  [1, 2, 3].forEach(n => {
    const m = raw.match(new RegExp(`ISSUE_${n}[:\\s]+([\\s\\S]+?)(?=\\nISSUE_|\\nSUMMARY|\\nCONFIDENCE|$)`, "i"));
    const val = m ? clean(m[1]) : null;
    issueLines[n - 1] = val || "NONE";
  });

  const summaryMatch = raw.match(/SUMMARY[:\s]+([\s\S]+?)(?=\nCONFIDENCE_SCORE|$)/i);
  let summary = summaryMatch ? clean(summaryMatch[1]) : null;
  if (!summary) {
    const sentences = raw.replace(/[A-Z_]+:/g, "").split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 30);
    summary = sentences[0] ? sentences[0].substring(0, 250) : "Verification complete.";
  }

  const realIssueCount = issueLines.filter(l => l !== "NONE").length;
  const reconciledVerdict = (realIssueCount > 0 && score < 85) ? "NEEDS_REVIEW"
    : (realIssueCount === 0 && score >= 80) ? "APPROVED"
    : verdict;

  return [
    `CONFIDENCE_SCORE: ${score}`,
    `ISSUES_FOUND: ${realIssueCount}`,
    `VERDICT: ${reconciledVerdict}`,
    ``,
    `ISSUE_1: ${issueLines[0]}`,
    `ISSUE_2: ${issueLines[1]}`,
    `ISSUE_3: ${issueLines[2]}`,
    ``,
    `SUMMARY: ${summary}`,
  ].join("\n");
}

export async function runVerification(goal, research, execution) {
  const output = await callLLM(
    "mid",
    `You are ChainMind's Verification Agent — a strict but fair fact-checker.

The Execution Agent had one job: extract EXACTLY 5 numbered data points, each specific and concrete, from research findings.

Your job: check if it did that correctly, then output your verdict.

CHECK FOR:
- Did it produce exactly 5 points numbered 1 through 5? (6+ points is a minor format issue, not a critical failure)
- Are the points specific (metrics, names, dates) or vague (general statements)?
- Do the claims match what the research actually says?
- Is anything missing or fabricated?

SCORING GUIDE — be fair, not punitive:
90-100 → all 5 points, specific, accurate = APPROVED
75-89  → minor issues: 6 points instead of 5, or 1 slightly vague claim = APPROVED
50-74  → multiple vague claims or clearly wrong data = NEEDS_REVIEW
0-49   → completely wrong format, fabricated data, or goal entirely missed = NEEDS_REVIEW

IMPORTANT: If the output has 6 points instead of 5 but all points are specific and accurate,
score it 75-85 (APPROVED) — extra thoroughness is not a critical failure.
Only score below 50 for genuinely bad output: fabricated data, totally vague claims, or wrong goal.

OUTPUT RULES — this is critical:
- Start your response with CONFIDENCE_SCORE: followed by a number
- Do not repeat or echo these instructions in your output
- Do not use square brackets in your output
- Write actual findings, not placeholder descriptions
- ISSUES_FOUND must equal the number of ISSUE fields that are not NONE
- If ISSUE_1, ISSUE_2, ISSUE_3 are all NONE then ISSUES_FOUND must be 0
- If you found 2 issues you must describe them in ISSUE_1 and ISSUE_2 — not write NONE`,
    `Example of correct output format (do not copy these values — use real ones):
CONFIDENCE_SCORE: 72
ISSUES_FOUND: 2
VERDICT: NEEDS_REVIEW

ISSUE_1: Only 3 of 5 required data points provided
ISSUE_2: Point 2 is vague — states "significant progress" without a specific metric
ISSUE_3: NONE

SUMMARY: The execution output partially satisfies the contract. Three of five data points are specific and accurate. Two points lack concrete metrics.

---
Now verify the actual execution output below:

Goal: ${goal}

Research Used:
${research}

Execution Output to Verify:
${execution}`
  );

  return normaliseVerification(output);
}

export function parseConfidenceScore(verificationOutput) {
  const match = verificationOutput.match(/CONFIDENCE_SCORE:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 75;
}

export function shouldTriggerGate(verificationOutput) {
  const score = parseConfidenceScore(verificationOutput);
  const hasNeedsReview = verificationOutput.includes("NEEDS_REVIEW");
  return score < 80 || hasNeedsReview;
}

// ── 5. MEMORY (unchanged from v6) ────────────────────────────────────────────
export async function runMemory(goal, allOutputs) {
  const output = await callLLM(
    "slm",
    `You are ChainMind's Memory Agent. You extract and store important knowledge.
Your job is to identify facts worth remembering for future similar tasks.

Return exactly this format:
SHORT_TERM_1: [current task context fact]
SHORT_TERM_2: [current task context fact]
LONG_TERM_1: [reusable domain knowledge]
LONG_TERM_2: [reusable domain knowledge]
EXPERIENCE_1: [lesson learned about this type of task]
EXPERIENCE_2: [what to do differently next time]

Keep each entry to one clear sentence.`,
    `Goal: ${goal}

Full Workflow Outputs:
${allOutputs}`
  );

  return output;
}

export function parseMemoryEntries(memoryOutput) {
  const entries = [];
  const lines = memoryOutput.split("\n");

  lines.forEach(line => {
    if (line.startsWith("SHORT_TERM_")) {
      const text = line.split(":").slice(1).join(":").trim();
      if (text && text !== "N/A") entries.push({ tier: 0, text });
    } else if (line.startsWith("LONG_TERM_")) {
      const text = line.split(":").slice(1).join(":").trim();
      if (text && text !== "N/A") entries.push({ tier: 1, text });
    } else if (line.startsWith("EXPERIENCE_")) {
      const text = line.split(":").slice(1).join(":").trim();
      if (text && text !== "N/A") entries.push({ tier: 2, text });
    }
  });

  return entries;
}

// ── 6. REPORT ─────────────────────────────────────────────────────────────────
// v9: detects org project mode and switches to assignment plan format
export async function runReport(goal, taskPlan, research, execution, verification, steerNote = null) {
  const steeringContext = steerNote
    ? `\nIMPORTANT - Human Steering Instruction: "${steerNote}"\nIncorporate this guidance into your final report.\n`
    : "";

  const isOrgProject = goal.includes("TEAM MEMBERS:");

  const systemPrompt = isOrgProject
    ? `You are ChainMind's Report Agent synthesizing an organizational project assignment plan.

${steeringContext}

Format your report as:
## Project Assignment Plan: [Project Name]

## Team Assignments
For each assigned employee provide:
- Employee name and role
- Their specific assigned task
- Why they were chosen (skills + workload match)
- Estimated sub-timeline

## Workload Analysis
Brief assessment of team capacity and any overload concerns.

## Risk Flags
Any assignments with high workload or skill gaps.

## Recommended Tools
Which tools from the MCP layer this project needs most.

## Manager Summary
2-3 sentences for the manager reviewing this plan.

Rules:
- Be specific — use real employee names and real task descriptions
- Flag employees at 50%+ workload clearly
- Professional tone
- Total length: 400-600 words`
    : `You are ChainMind's Report Agent. You synthesize all agent outputs into
a clear, professional final report.

${steeringContext}

Format your report with these exact sections:
## Executive Summary
[2-3 sentence overview]

## Key Findings
[5 bullet points with the most important discoveries]

## Analysis
[2-3 paragraphs of detailed analysis]

## Recommendations
[3 numbered, actionable recommendations]

## Conclusion
[1-2 sentences wrapping up]

Rules:
- Be specific and factual, not vague
- Reference actual data points from the research
- Professional tone, suitable for a business audience
- Total length: 400-600 words`;

  const output = await callLLM(
    "frontier",
    systemPrompt,
    `Original Goal: ${goal}

Task Plan:
${taskPlan}

Research Findings:
${research}

Processed Data:
${execution}

Verification Assessment:
${verification}`
  );

  return output;
}