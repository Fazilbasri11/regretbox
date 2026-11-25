import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function LegalPage() {
  return (
    <div className="page-scroll">
      <div className="page-container" style={{ maxWidth: 800 }}>
        <Link to="/" className="btn btn--ghost" style={{ marginBottom: 20 }}>
          <ArrowLeft size={16} />
          <span>Back to Cemetery</span>
        </Link>

        <h1 className="serif" style={{ fontSize: 40, marginTop: 0 }}>
          Terms & Privacy
        </h1>

        <section className="glass-card" style={{ padding: 22, marginBottom: 16 }}>
          <h2 className="serif" style={{ marginTop: 0 }}>
            1. Public & Permanent Publication
          </h2>
          <p style={{ color: 'var(--text-dim)' }}>
            RegretBox has no user accounts, login, profiles, email reminders, or private history.
            Every sentence submitted via <strong>Add Your Regret</strong> is immediately carved onto
            a public gravestone with a permanent unique number and is readable by anyone.
          </p>
          <p style={{ color: 'var(--text-dim)', marginBottom: 0 }}>
            Once buried, sentences cannot be edited or removed by the sender. Do not include your
            real name, phone number, email address, passwords, or identifying information.
          </p>
        </section>

        <section className="glass-card" style={{ padding: 22, marginBottom: 16 }}>
          <h2 className="serif" style={{ marginTop: 0 }}>
            2. Moderation & Reporting
          </h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: 0 }}>
            Threats, harassment, hate speech, personal data (doxxing), spam, and illegal content are
            prohibited. Visitors can flag stones via <strong>Report this gravestone</strong>;
            reported stones may be hidden while retired numbers are never reused.
          </p>
        </section>

        <section className="glass-card" style={{ padding: 22 }}>
          <h2 className="serif" style={{ marginTop: 0 }}>
            3. Rate Limiting & Minimal Retention
          </h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: 0 }}>
            To protect anonymous endpoints from spam, requests use short-lived in-memory rate
            limiting keyed by an HMAC hash of the client IP address. Raw IP addresses are not
            stored in the database.
          </p>
        </section>
      </div>
    </div>
  );
}
