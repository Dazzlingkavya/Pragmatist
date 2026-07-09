import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api";

function ProtectedRoute({ children }) {
  return localStorage.getItem("superAdminToken") ? children : <Navigate to="/login" replace />;
}

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "superadmin@example.com", password: "admin123" });
  const [status, setStatus] = useState({ loading: false, error: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "" });
    try {
      const response = await api.post("/super-admin/login", form);
      localStorage.setItem("superAdminToken", response.data.token);
      navigate("/dashboard");
    } catch (error) {
      setStatus({ loading: false, error: error.response?.data?.message || "Login failed" });
    }
  }

  return (
    <main className="page narrow">
      <section className="panel">
        <h1>Super Admin Login</h1>
        <form onSubmit={handleSubmit} className="form">
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
          <button disabled={status.loading}>{status.loading ? "Signing in..." : "Login"}</button>
        </form>
      </section>
    </main>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [status, setStatus] = useState({ loading: true, saving: false, message: "", error: "" });

  async function loadOrganizations() {
    setStatus((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await api.get("/organizations");
      setOrganizations(response.data.organizations);
      setStatus((current) => ({ ...current, loading: false }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        loading: false,
        error: error.response?.data?.message || "Could not load organizations"
      }));
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, message: "", error: "" }));
    try {
      await api.post("/organizations", form);
      setForm({ name: "", slug: "" });
      setStatus((current) => ({ ...current, saving: false, message: "Organization created" }));
      loadOrganizations();
    } catch (error) {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || "Could not create organization"
      }));
    }
  }

  function logout() {
    localStorage.removeItem("superAdminToken");
    navigate("/login");
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Super Admin</p>
          <h1>Organizations</h1>
        </div>
        <button className="secondary" onClick={logout}>Logout</button>
      </header>

      <section className="grid">
        <form className="panel form" onSubmit={handleCreate}>
          <h2>Create Organization</h2>
          <label>
            Organization name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Acme Corp"
              required
            />
          </label>
          <label>
            Organization slug
            <input
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase() })}
              placeholder="acme"
              required
            />
          </label>
          {status.message && <p className="alert success">{status.message}</p>}
          {status.error && <p className="alert error">{status.error}</p>}
          <button disabled={status.saving}>{status.saving ? "Creating..." : "Create"}</button>
        </form>

        <section className="panel">
          <h2>All Organizations</h2>
          {status.loading ? (
            <p>Loading organizations...</p>
          ) : organizations.length === 0 ? (
            <p>No organizations yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr key={organization._id}>
                    <td>{organization.name}</td>
                    <td>{organization.slug}</td>
                    <td>{new Date(organization.createdAt).toLocaleDateString()}</td>
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
      <Route path="/login" element={<LoginPage />} />
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
