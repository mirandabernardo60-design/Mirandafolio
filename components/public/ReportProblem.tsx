"use client";
import { useState, useTransition } from "react";
import { reportProblem } from "@/app/member-actions";
import { Icon } from "./Icon";

const REASONS = [
  { v: "broken-link", l: "The link is broken or the site is down" },
  { v: "wrong-info", l: "Information is wrong or out of date" },
  { v: "inappropriate", l: "Inappropriate or spam" },
  { v: "other", l: "Something else" },
] as const;

export function ReportProblem({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const close = () => { setOpen(false); setTimeout(() => { setState(null); setReason(""); setMessage(""); }, 200); };
  const send = () => start(async () => {
    const r = await reportProblem({ siteId, reason, message });
    setState(r.ok ? { ok: true, text: "Thanks — the report was sent." } : { ok: false, text: r.error });
  });

  return (
    <>
      <button className="row" style={{ background: "none", border: 0, width: "100%" }} onClick={() => setOpen(true)}>
        <Icon name="flag" width={14} /> Report a problem
      </button>
      {open && (
        <div className="rp-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className="rp" role="dialog" aria-modal="true" aria-labelledby="rp-title">
            <div className="rp-head">
              <h2 id="rp-title">Report a problem with {siteName}</h2>
              <button className="icon-btn" aria-label="Close" onClick={close}><Icon name="x" width={16} /></button>
            </div>
            {state?.ok ? (
              <>
                <p className="rp-ok" role="status">{state.text}</p>
                <button className="btn-pill" style={{ border: 0 }} onClick={close}>Done</button>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); send(); }}>
                <fieldset className="rp-reasons">
                  <legend>What’s wrong?</legend>
                  {REASONS.map((r) => (
                    <label key={r.v}><input type="radio" name="reason" value={r.v} checked={reason === r.v} onChange={() => setReason(r.v)} /> {r.l}</label>
                  ))}
                </fieldset>
                <label className="rp-note">Details (optional)
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={4} placeholder="Tell us what you noticed" />
                </label>
                {state && !state.ok && <p className="rp-err" role="alert">{state.text}</p>}
                <div className="rp-actions">
                  <button type="button" className="btn-ghost" style={{ background: "none", border: 0 }} onClick={close}>Cancel</button>
                  <button className="btn-pill" style={{ border: 0 }} disabled={!reason || pending}>{pending ? "Sending…" : "Send report"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
