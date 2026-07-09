import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api";

const emptyFlag = { featureKey: "", description: "", enabled: false };

function ProtectedRoute({ children }) {
  return localStorage.getItem("adminToken") ? children : <Navigate to="/login" replace />;
}

function AuthPage({ mode }) {
  const navigate = useNavigate();
  const isSignup = mode === "signup";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organizationSlug: ""
  });
  const [status, setStatus] = useState({ loading: false, error: "", message: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "", message: "" });
    try {
      if (isSignup) {
        await api.post("/admin/signup", form);
        setStatus({
          loading: false,
          error: "",
          message: "Signup successful. You can log in now."
        });
        return;
      }

      const response = await api.post("/admin/login", {
        email: form.email,
        password: form.password
      });
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminUser", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (error) {
      setStatus({
        loading: false,
        error: error.response?.data?.message || "Request failed",
        message: ""
      });
    }
  }

  return (
    <main className="page narrow">
      <section className="panel">
        <h1>{isSignup ? "Admin Signup" : "Admin Login"}</h1>
        <form className="form" onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </label>
              <label>
                Organization slug
                <input
                  value={form.organizationSlug}
                  onChange={(event) =>
                    setForm({ ...form, organizationSlug: event.target.value.toLowerCase() })
                  }
                  placeholder="acme"
                  required
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          {status.error && <p className="alert error">{status.error}</p>}
          {status.message && <p className="alert success">{status.message}</p>}
          <button disabled={status.loading}>{status.loading ? "Please wait..." : isSignup ? "Signup" : "Login"}</button>
        </form>
        <p className="switch">
          {isSignup ? <Link to="/login">Already have an account?</Link> : <Link to="/signup">Create an admin account</Link>}
        </p>
      </section>
    </main>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState([]);
  const [form, setForm] = useState(emptyFlag);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState({ loading: true, saving: false, message: "", error: "" });
  const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

  async function loadFlags() {
    setStatus((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await api.get("/feature-flags");
      setFlags(response.data.flags);
      setStatus((current) => ({ ...current, loading: false }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        loading: false,
        error: error.response?.data?.message || "Could not load feature flags"
      }));
    }
  }

  useEffect(() => {
    loadFlags();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, message: "", error: "" }));
    try {
      if (editingId) {
        await api.put(`/feature-flags/${editingId}`, form);
      } else {
        await api.post("/feature-flags", form);
      }
      setForm(emptyFlag);
      setEditingId("");
      setStatus((current) => ({
        ...current,
        saving: false,
        message: editingId ? "Feature flag updated" : "Feature flag created"
      }));
      loadFlags();
    } catch (error) {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || "Could not save feature flag"
      }));
    }
  }

  function startEdit(flag) {
    setEditingId(flag._id);
    setForm({
      featureKey: flag.featureKey,
      description: flag.description || "",
      enabled: flag.enabled
    });
  }

  async function toggleFlag(flag) {
    setStatus((current) => ({ ...current, error: "", message: "" }));
    try {
      await api.put(`/feature-flags/${flag._id}`, {
        featureKey: flag.featureKey,
        description: flag.description || "",
        enabled: !flag.enabled
      });
      setStatus((current) => ({ ...current, message: "Feature flag updated" }));
      loadFlags();
    } catch (error) {
      setStatus((current) => ({
        ...current,
        error: error.response?.data?.message || "Could not toggle feature flag"
      }));
    }
  }

  async function deleteFlag(flag) {
    setStatus((current) => ({ ...current, error: "", message: "" }));
    try {
      await api.delete(`/feature-flags/${flag._id}`);
      setStatus((current) => ({ ...current, message: "Feature flag deleted" }));
      loadFlags();
    } catch (error) {
      setStatus((current) => ({
        ...current,
        error: error.response?.data?.message || "Could not delete feature flag"
      }));
    }
  }

  function logout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/login");
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">{user.organization?.name || "Organization Admin"}</p>
          <h1>Feature Flags</h1>
        </div>
        <button className="secondary" onClick={logout}>Logout</button>
      </header>

      <section className="grid">
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Feature Flag" : "Create Feature Flag"}</h2>
          <label>
            Feature key
            <input
              value={form.featureKey}
              onChange={(event) => setForm({ ...form, featureKey: event.target.value.toLowerCase() })}
              placeholder="dark_mode"
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows="3"
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
            />
            Enabled
          </label>
          {status.message && <p className="alert success">{status.message}</p>}
          {status.error && <p className="alert error">{status.error}</p>}
          <button disabled={status.saving}>{status.saving ? "Saving..." : editingId ? "Update Flag" : "Create Flag"}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={() => {
              setEditingId("");
              setForm(emptyFlag);
            }}>
              Cancel Edit
            </button>
          )}
        </form>

        <section className="panel">
          <h2>Flags</h2>
          {status.loading ? (
            <p>Loading feature flags...</p>
          ) : flags.length === 0 ? (
            <p>No flags created yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((flag) => (
                  <tr key={flag._id}>
                    <td>{flag.featureKey}</td>
                    <td>{flag.description || "-"}</td>
                    <td>
                      <span className={flag.enabled ? "pill on" : "pill off"}>
                        {flag.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="actions">
                      <button type="button" onClick={() => toggleFlag(flag)}>
                        Toggle
                      </button>
                      <button type="button" className="secondary" onClick={() => startEdit(flag)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => deleteFlag(flag)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
