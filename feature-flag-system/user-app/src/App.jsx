import { useState } from "react";
import api from "./api";

export default function App() {
  const [form, setForm] = useState({ organizationSlug: "acme", featureKey: "dark_mode" });
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "" });
    setResult(null);
    try {
      const response = await api.post("/check-feature", form);
      setResult(response.data);
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({
        loading: false,
        error: error.response?.data?.message || "Could not check feature"
      });
    }
  }

  return (
    <main className="page narrow">
      <section className="panel">
        <p className="eyebrow">Feature availability</p>
        <h1>Check a Feature Flag</h1>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Organization slug
            <input
              value={form.organizationSlug}
              onChange={(event) =>
                setForm({ ...form, organizationSlug: event.target.value.toLowerCase() })
              }
              required
            />
          </label>
          <label>
            Feature key
            <input
              value={form.featureKey}
              onChange={(event) => setForm({ ...form, featureKey: event.target.value.toLowerCase() })}
              required
            />
          </label>
          {status.error && <p className="alert error">{status.error}</p>}
          <button disabled={status.loading}>{status.loading ? "Checking..." : "Check Feature"}</button>
        </form>

        {result && (
          <div className={result.enabled ? "result enabled" : "result disabled"}>
            <span>{result.enabled ? "Enabled" : "Disabled"}</span>
            <h2>{result.featureKey}</h2>
            <p>{result.message} for {result.organization}.</p>
          </div>
        )}
      </section>
    </main>
  );
}
