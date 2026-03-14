import { useState, useRef } from "react";
import { runPlanner, runResearch, runExecution, runVerification, runMemory, runReport } from "./api.js";

const AGENTS = [
  { key: "planner",      label: "Planner",      color: "#7C3AED", model: "FRONTIER", task: "Decompose goal into sub-tasks"         },
  { key: "research",     label: "Research",     color: "#0EA5E9", model: "MID+WEB",  task: "Search web & gather information"       },
  { key: "execution",    label: "Execution",    color: "#10B981", model: "SLM",      task: "Extract & structure key data points"   },
  { key: "verification", label: "Verification", color: "#F59E0B", model: "MID",      task: "Fact-check outputs & score confidence" },
  { key: "memory",       label: "Memory",       color: "#6366F1", model: "SLM",      task: "Extract & store knowledge"             },
  { key: "report",       label: "Report",       color: "#EC4899", model: "FRONTIER", task: "Synthesise final structured report"    },
];

const RUNNERS = {
  planner:      (goal, o) => runPlanner(goal),
  research:     (goal, o) => runResearch(goal, o.planner),
  execution:    (goal, o) => runExecution(goal, o.planner, o.research),
  verification: (goal, o) => runVerification(goal, o.research, o.execution),
  memory:       (goal, o) => runMemory(goal, Object.values(o).join("\n\n")),
  report:       (goal, o) => runReport(goal, o.planner, o.research, o.execution, o.verification, o.steerNote),
};

// ── Approval Gate Modal ───────────────────────────────────────────────────────
function ApprovalGate({ score, verificationOutput, onApprove, onReject, onSteer }) {
  const [steerNote, setSteerNote] = useState("");
  const [showSteer, setShowSteer] = useState(false);

  const scoreColor = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,8,0.88)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "linear-gradient(135deg,#080818,#0c0820)",
        border: "1px solid #F59E0B99",
        borderRadius: 20, padding: 34,
        maxWidth: 520, width: "92%",
        boxShadow: "0 0 70px rgba(245,158,11,.22)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "rgba(245,158,11,.12)",
            border: "1px solid rgba(245,158,11,.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>⚠</div>
          <div>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 15 }}>
              Conditional Approval Gate
            </div>
            <div style={{ color: "#713f12", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, marginTop: 2 }}>
              HUMAN REVIEW REQUIRED
            </div>
          </div>
          {/* Score badge */}
          <div style={{
            marginLeft: "auto", textAlign: "center",
            background: "rgba(0,0,0,0.3)", borderRadius: 10,
            padding: "8px 14px", border: `1px solid ${scoreColor}44`,
          }}>
            <div style={{ color: scoreColor, fontSize: 24, fontWeight: 800, fontFamily: "monospace", lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ color: "#334155", fontSize: 8, fontFamily: "monospace", letterSpacing: 1 }}>
              CONFIDENCE
            </div>
          </div>
        </div>

        {/* Verification output */}
        <div style={{
          background: "rgba(245,158,11,.05)",
          border: "1px solid rgba(245,158,11,.18)",
          borderRadius: 10, padding: 12, marginBottom: 16,
          maxHeight: 140, overflowY: "auto",
        }}>
          <div style={{ color: "#713f12", fontSize: 9, fontFamily: "monospace", letterSpacing: 1, marginBottom: 6 }}>
            VERIFICATION OUTPUT
          </div>
          <div style={{ color: "#e2e8f0", fontSize: 11, fontFamily: "monospace", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {verificationOutput}
          </div>
        </div>

        {/* Steer input */}
        {showSteer && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#6366F1", fontSize: 9, fontFamily: "monospace", letterSpacing: 1, marginBottom: 6 }}>
              STEERING NOTE — injected into Report context
            </div>
            <textarea
              value={steerNote}
              onChange={e => setSteerNote(e.target.value)}
              placeholder="Tell the Report agent what to correct or emphasise…"
              rows={3}
              style={{
                width: "100%", background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(99,102,241,0.4)",
                borderRadius: 8, padding: "8px 10px",
                color: "#e2e8f0", fontSize: 11,
                fontFamily: "monospace", resize: "vertical", outline: "none",
              }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onApprove}
            style={{
              flex: 1, padding: "11px 0",
              background: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.4)",
              borderRadius: 10, color: "#34d399",
              fontSize: 12, fontWeight: 700,
              fontFamily: "monospace", cursor: "pointer",
            }}
          >✓ APPROVE</button>

          {!showSteer ? (
            <button
              onClick={() => setShowSteer(true)}
              style={{
                flex: 1, padding: "11px 0",
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.4)",
                borderRadius: 10, color: "#818cf8",
                fontSize: 12, fontWeight: 700,
                fontFamily: "monospace", cursor: "pointer",
              }}
            >↻ STEER</button>
          ) : (
            <button
              onClick={() => onSteer(steerNote)}
              disabled={!steerNote.trim()}
              style={{
                flex: 1, padding: "11px 0",
                background: steerNote.trim() ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.4)",
                borderRadius: 10, color: "#818cf8",
                fontSize: 12, fontWeight: 700,
                fontFamily: "monospace",
                cursor: steerNote.trim() ? "pointer" : "not-allowed",
              }}
            >↻ SUBMIT STEER</button>
          )}

          <button
            onClick={onReject}
            style={{
              flex: 1, padding: "11px 0",
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.4)",
              borderRadius: 10, color: "#f87171",
              fontSize: 12, fontWeight: 700,
              fontFamily: "monospace", cursor: "pointer",
            }}
          >✕ REJECT</button>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, status, output, isActive }) {
  const borderColor = status === "done" ? agent.color
    : status === "active" ? agent.color
    : "rgba(255,255,255,0.06)";
  const bg = status === "active" ? `${agent.color}12` : "rgba(8,8,26,0.9)";

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      borderRadius: 12, padding: 16,
      background: bg, transition: "all 0.4s ease",
      boxShadow: status === "active" ? `0 0 20px ${agent.color}33` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: status === "pending" ? "#1e293b" : agent.color,
          boxShadow: status === "active" ? `0 0 10px ${agent.color}` : "none",
          transition: "all 0.3s",
        }} />
        <span style={{ color: status === "pending" ? "#334155" : agent.color, fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>
          {agent.label}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 8, color: "#334155", fontFamily: "monospace", letterSpacing: 1 }}>
          {agent.model}
        </span>
        {status === "done"   && <span style={{ fontSize: 10, color: agent.color }}>✓</span>}
        {status === "active" && <span style={{ fontSize: 8, color: agent.color, fontFamily: "monospace", animation: "blink 1s infinite" }}>RUNNING</span>}
      </div>
      <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace", marginBottom: 8 }}>
        {agent.task}
      </div>
      {output && (
        <div style={{
          background: "rgba(0,0,0,0.4)", borderRadius: 6,
          padding: "8px 10px", fontSize: 10, color: "#94a3b8",
          fontFamily: "monospace", lineHeight: 1.6,
          maxHeight: 120, overflowY: "auto", whiteSpace: "pre-wrap",
          borderLeft: `2px solid ${agent.color}44`,
        }}>
          {output.substring(0, 400)}{output.length > 400 ? "…" : ""}
        </div>
      )}
      {isActive && (
        <div style={{ marginTop: 10, height: 2, background: "#0a0a18", borderRadius: 1, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: "40%",
            background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
            animation: "scan 1.5s ease-in-out infinite",
          }} />
        </div>
      )}
    </div>
  );
}

// Extract confidence score from verification output
function extractScore(text) {
  const match = text.match(/SCORE[:\s]+(\d+)/i) || text.match(/(\d+)\s*\/\s*100/);
  return match ? Math.min(100, parseInt(match[1])) : 70;
}

export default function App() {
  const [goal, setGoal]       = useState("");
  const [phase, setPhase]     = useState("idle");
  const [statuses, setStatuses] = useState({});
  const [outputs, setOutputs] = useState({});
  const [gate, setGate]       = useState(null);   // { score, verificationOutput }
  const [error, setError]     = useState(null);
  const live = useRef(true);
  const gateResolve = useRef(null);

  const setStatus = (key, val) => setStatuses(p => ({ ...p, [key]: val }));

  // Returns "approve" | "reject" | steer-note string
  function waitForGate(score, verificationOutput) {
    return new Promise(resolve => {
      gateResolve.current = resolve;
      setGate({ score, verificationOutput });
    });
  }

  function handleApprove()       { setGate(null); gateResolve.current?.("approve"); }
  function handleReject()        { setGate(null); gateResolve.current?.("reject");  }
  function handleSteer(note)     { setGate(null); gateResolve.current?.(note);      }

  async function run() {
    if (!goal.trim()) return;
    live.current = true;
    setPhase("running");
    setStatuses({});
    setOutputs({});
    setError(null);
    setGate(null);

    const collected = {};

    for (const agent of AGENTS) {
      if (!live.current) break;
      setStatus(agent.key, "active");

      try {
        const result = await RUNNERS[agent.key](goal, collected);
        collected[agent.key] = result;
        setOutputs(p => ({ ...p, [agent.key]: result }));
        setStatus(agent.key, "done");

        // ── Gate fires after Verification ──────────────────────────────────
        if (agent.key === "verification") {
          const score = extractScore(result);
          const decision = await waitForGate(score, result);

          if (decision === "reject") {
            setPhase("rejected");
            return;
          }
          if (decision !== "approve") {
            // It's a steer note
            collected.steerNote = decision;
          }
        }

      } catch (err) {
        setStatus(agent.key, "error");
        setError(`${agent.label} failed: ${err.message}`);
        setPhase("error");
        return;
      }
    }
    setPhase("done");
  }

  function reset() {
    live.current = false;
    setPhase("idle");
    setStatuses({});
    setOutputs({});
    setError(null);
    setGate(null);
    setGoal("");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#04040e", color: "#94a3b8", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scan  { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#7C3AED44;border-radius:2px}
      `}</style>

      {/* Gate modal */}
      {gate && (
        <ApprovalGate
          score={gate.score}
          verificationOutput={gate.verificationOutput}
          onApprove={handleApprove}
          onReject={handleReject}
          onSteer={handleSteer}
        />
      )}

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto 28px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
          Chain<span style={{ color: "#7C3AED" }}>Mind</span>
        </h1>
        <p style={{ fontSize: 12, color: "#334155", fontFamily: "monospace" }}>
          v2 · Conditional Approval Gate added
        </p>
      </div>

      {/* Goal input */}
      <div style={{ maxWidth: 900, margin: "0 auto 24px" }}>
        <textarea
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="Enter your research goal…"
          rows={3}
          style={{
            width: "100%", background: "rgba(8,8,26,0.9)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10, padding: "12px 14px",
            color: "#f1f5f9", fontSize: 13, fontFamily: "monospace",
            resize: "vertical", outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button
            onClick={run}
            disabled={phase === "running" || !goal.trim()}
            style={{
              padding: "10px 24px",
              background: phase === "running" ? "#1e293b" : "#7C3AED",
              border: "none", borderRadius: 8,
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: phase === "running" ? "not-allowed" : "pointer",
              fontFamily: "monospace",
            }}
          >
            {phase === "running" ? "Running…" : "▶ Run Pipeline"}
          </button>
          {phase !== "idle" && (
            <button
              onClick={reset}
              style={{
                padding: "10px 20px", background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, color: "#475569",
                fontSize: 13, cursor: "pointer", fontFamily: "monospace",
              }}
            >Reset</button>
          )}
        </div>
      </div>

      {/* Rejected banner */}
      {phase === "rejected" && (
        <div style={{
          maxWidth: 900, margin: "0 auto 16px",
          padding: "12px 16px",
          background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 10, color: "#f87171",
          fontSize: 12, fontFamily: "monospace",
        }}>
          ✕ Pipeline rejected at gate. No report generated.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          maxWidth: 900, margin: "0 auto 16px",
          padding: "10px 14px",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8, color: "#f87171",
          fontSize: 12, fontFamily: "monospace",
        }}>✕ {error}</div>
      )}

      {/* Agent grid */}
      <div style={{
        maxWidth: 900, margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
      }}>
        {AGENTS.map(agent => (
          <AgentCard
            key={agent.key}
            agent={agent}
            status={statuses[agent.key] || "pending"}
            output={outputs[agent.key]}
            isActive={statuses[agent.key] === "active"}
          />
        ))}
      </div>

      {/* Final report */}
      {phase === "done" && outputs.report && (
        <div style={{
          maxWidth: 900, margin: "24px auto 0",
          background: "rgba(8,8,26,0.9)",
          border: "1px solid rgba(236,72,153,0.3)",
          borderRadius: 14, padding: 20,
        }}>
          <div style={{ color: "#EC4899", fontSize: 10, fontFamily: "monospace", letterSpacing: 2, marginBottom: 12 }}>
            FINAL REPORT
          </div>
          <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {outputs.report}
          </div>
        </div>
      )}
    </div>
  );
}