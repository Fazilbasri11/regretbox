export function LegalPage() {
  return (
    <main className="app-main" style={{ maxWidth: 820 }}>
      <h1 className="serif" style={{ fontSize: '2.3rem', marginTop: 0 }}>
        Terms of Burial & Privacy
      </h1>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="serif" style={{ marginTop: 0 }}>
          1. Anonymous Public Publication
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          RegretBox has no user accounts, login, profiles, email reminders, or private dashboards.
          Every sentence submitted through <strong>Bury a Regret</strong> is immediately carved onto
          a public gravestone with a permanent sequential number (e.g. <code>#00291</code>) and can
          be read by any visitor.
        </p>
        <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
          Once buried, a sentence cannot be edited or withdrawn by the sender. Do not submit full
          names, phone numbers, email addresses, passwords, financial data, or any personally
          identifying details.
        </p>
      </section>

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="serif" style={{ marginTop: 0 }}>
          2. Content Rules & Moderation
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Threats, harassment, hate speech, personal data (doxxing), spam, and illegal content are
          strictly prohibited. Any visitor can report a gravestone via{' '}
          <strong>Report this gravestone</strong>. Reported stones may be flagged or hidden from
          public view, while retired grave numbers are never reused.
        </p>
      </section>

      <section className="card">
        <h2 className="serif" style={{ marginTop: 0 }}>
          3. Rate Limiting & Minimal Data Retention
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
          To prevent spam and abuse on anonymous endpoints, server requests use short-lived in-memory
          rate limiting keyed by a cryptographic HMAC hash of the client IP address. Raw IP
          addresses are not stored in the database.
        </p>
      </section>
    </main>
  );
}
