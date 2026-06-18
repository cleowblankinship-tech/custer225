export function DistributionClauseResponse() {
  return (
    <div className="assistant-message-body">
      <p className="assistant-lead">
        I found the discretionary distribution clause in the Henderson Family Trust document.
        Here's a summary:
      </p>

      <div className="clause-block">
        <div className="clause-citation">
          <span className="citation-tag">Page 14 · Section 7.2</span>
          <span className="citation-doc">Henderson_Family_Trust.pdf</span>
        </div>
        <blockquote className="clause-quote">
          "The Trustee shall have the absolute and uncontrolled discretion to distribute income
          and/or principal to or for the benefit of any one or more of the Beneficiaries, to the
          exclusion of others, in such amounts and at such times as the Trustee, in its sole
          judgment, determines to be necessary or advisable for the health, education, maintenance,
          or support of such Beneficiary…"
        </blockquote>
      </div>

      <div className="summary-block">
        <div className="summary-heading">Plain-language summary</div>
        <p>
          The Trustee can make distributions at their sole discretion — no Beneficiary has the
          right to demand a distribution. Distributions are permissible when triggered by any of
          the following:
        </p>
        <ul className="trigger-list">
          <li>
            <span className="trigger-label">Health</span> — medical, dental, or long-term care
            expenses not covered by insurance
          </li>
          <li>
            <span className="trigger-label">Education</span> — tuition, room and board, and
            related costs at accredited institutions
          </li>
          <li>
            <span className="trigger-label">Maintenance &amp; Support</span> — expenses reasonably
            necessary to maintain the Beneficiary's accustomed standard of living
          </li>
        </ul>
        <p className="assistant-note">
          <strong>Note:</strong> Section 7.3 (Page 15) adds a "spendthrift" overlay — distributions
          cannot be assigned by a Beneficiary or reached by their creditors before receipt. Worth
          flagging to the Hendersons if creditor protection is a priority.
        </p>
      </div>
    </div>
  );
}

export function SpreadsheetComparisonResponse() {
  const rows = [
    {
      feature: 'Trustee discretion',
      henderson: 'Absolute — no beneficiary demand right',
      standard: 'Absolute or guided by ascertainable standard',
    },
    {
      feature: 'Distribution triggers',
      henderson: 'HEMS + Trustee judgment',
      standard: 'HEMS only (typical)',
    },
    {
      feature: 'Spendthrift clause',
      henderson: 'Yes — §7.3',
      standard: 'Often omitted or optional',
    },
    {
      feature: 'Income accumulation',
      henderson: 'Permitted indefinitely',
      standard: 'Permitted, may have limits',
    },
    {
      feature: 'Principal invasion rights',
      henderson: 'Trustee only',
      standard: 'Trustee only (standard)',
    },
  ];

  return (
    <div className="assistant-message-body">
      <p className="assistant-lead">
        Done. I've built a comparison of the Henderson Trust's discretionary provisions against a
        standard discretionary trust template. Here's a preview:
      </p>

      <div className="table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Henderson Family Trust</th>
              <th>Standard Discretionary Trust</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="feature-col">{row.feature}</td>
                <td>{row.henderson}</td>
                <td>{row.standard}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="download-row">
        <button className="download-btn" onClick={(e) => e.preventDefault()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download .xlsx
        </button>
        <span className="download-note">Henderson_Trust_Comparison.xlsx · 5 rows, 3 columns</span>
      </div>
    </div>
  );
}

export function MartinezBriefingResponse() {
  return (
    <div className="assistant-message-body">
      <p className="assistant-lead">
        Here's your pre-meeting brief for the Martinez family — 2:00 PM today.
      </p>

      <div className="briefing-section">
        <div className="briefing-heading">
          <span className="briefing-icon">👤</span> Client Overview
        </div>
        <div className="briefing-grid">
          <div className="briefing-row">
            <span className="briefing-key">Clients</span>
            <span className="briefing-val">Carlos &amp; Elena Martinez, married, ages 61 &amp; 58</span>
          </div>
          <div className="briefing-row">
            <span className="briefing-key">Relationship since</span>
            <span className="briefing-val">2014 · 11 years</span>
          </div>
          <div className="briefing-row">
            <span className="briefing-key">Risk profile</span>
            <span className="briefing-val">Moderate-Conservative (last updated Jan 2025)</span>
          </div>
          <div className="briefing-row">
            <span className="briefing-key">AUM</span>
            <span className="briefing-val">$2.4M across 3 accounts</span>
          </div>
        </div>
      </div>

      <div className="briefing-section">
        <div className="briefing-heading">
          <span className="briefing-icon">📈</span> Portfolio Snapshot
        </div>
        <p>
          Current allocation: 48% equities, 38% fixed income, 14% alternatives. Slightly underweight
          equities vs. their IPS target of 55%. Last rebalance was April 2025 — may be worth
          revisiting if they're open to it.
        </p>
      </div>

      <div className="briefing-section">
        <div className="briefing-heading">
          <span className="briefing-icon">📞</span> Recent Contact Notes
        </div>
        <ul className="contact-notes">
          <li>
            <span className="note-date">May 28</span> — Carlos called re: required minimum
            distributions from his IRA. Wants to understand options for charitable giving via QCD.
          </li>
          <li>
            <span className="note-date">Apr 3</span> — Annual review meeting. Elena expressed
            interest in funding a 529 for their granddaughter (born Feb 2025).
          </li>
          <li>
            <span className="note-date">Feb 12</span> — Email thread re: annuity question (see below).
          </li>
        </ul>
      </div>

      <div className="briefing-section briefing-highlight">
        <div className="briefing-heading">
          <span className="briefing-icon">⚠️</span> Open Question — Annuity
        </div>
        <p>
          At the February meeting, Carlos raised the idea of moving ~$400K from their taxable
          account into a fixed-index annuity to guarantee income in early retirement. This was
          not resolved — Elena was uncertain. They asked for a comparison of annuity income
          projections vs. a managed withdrawal strategy. <strong>This is likely the main agenda
          item today.</strong>
        </p>
        <div className="briefing-action">Suggested prep: pull the annuity illustration from carrier + run a Monte Carlo on the managed withdrawal alternative.</div>
      </div>
    </div>
  );
}

export function SimpleResponse({ content }) {
  return (
    <div className="assistant-message-body">
      <p>{content}</p>
    </div>
  );
}
