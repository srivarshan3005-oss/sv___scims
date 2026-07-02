import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: 'bi-file-earmark-text', title: 'Submit Complaints', desc: 'File complaints easily with photo evidence and precise location details.' },
  { icon: 'bi-geo-alt',           title: 'Track in Real-Time', desc: 'Monitor your complaint status from submission to resolution.' },
  { icon: 'bi-shield-check',      title: 'Secure & Private',   desc: 'JWT-secured platform ensuring your data is always protected.' },
  { icon: 'bi-speedometer2',      title: 'Fast Resolution',    desc: 'Admin team responds promptly with updates at every stage.' },
  { icon: 'bi-people',            title: 'Community Driven',   desc: 'Citizens and administrators working together for a better city.' },
  { icon: 'bi-graph-up',          title: 'Full Transparency',  desc: 'Complete status history so you always know what\'s happening.' },
];

const categories = [
  { icon: 'bi-cone-striped',   name: 'Road Damage',     color: '#ef4444' },
  { icon: 'bi-trash3',         name: 'Garbage',         color: '#f97316' },
  { icon: 'bi-droplet',        name: 'Water Leakage',   color: '#3b82f6' },
  { icon: 'bi-lightbulb',      name: 'Streetlight',     color: '#eab308' },
  { icon: 'bi-water',          name: 'Drainage',        color: '#06b6d4' },
  { icon: 'bi-shield-exclamation', name: 'Public Safety', color: '#8b5cf6' },
  { icon: 'bi-exclamation-triangle', name: 'Illegal Dumping', color: '#ec4899' },
  { icon: 'bi-three-dots',     name: 'Other',           color: '#64748b' },
];

const steps = [
  { step: '01', title: 'Register Account', desc: 'Create your free citizen account in under a minute.' },
  { step: '02', title: 'Submit Complaint',  desc: 'Describe the issue, add location and attach a photo.' },
  { step: '03', title: 'Get Assigned',      desc: 'Admin reviews and assigns to the right department.' },
  { step: '04', title: 'Issue Resolved',    desc: 'Receive status updates until the issue is fixed.' },
];

export default function LandingPage() {
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 200 }}>
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="bi bi-building me-2"></i>SCIMS<span>.</span>
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center gap-2">
              <li className="nav-item"><a className="nav-link" href="#features">Features</a></li>
              <li className="nav-item"><a className="nav-link" href="#categories">Categories</a></li>
              <li className="nav-item"><a className="nav-link" href="#how-it-works">How It Works</a></li>
              <li className="nav-item">
                <Link className="btn btn-outline-light btn-sm me-2" to="/login">Login</Link>
              </li>
              <li className="nav-item">
                <Link className="btn btn-primary btn-sm" to="/register">Register Free</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center min-vh-80">
            <div className="col-lg-6">
              <span className="badge mb-3" style={{ background: 'rgba(96,165,250,0.2)', color: '#93c5fd', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
                🏙️ Smart City Platform
              </span>
              <h1 className="display-4 fw-bold mb-4" style={{ lineHeight: 1.15 }}>
                Report City Issues.<br />
                <span style={{ color: '#60a5fa' }}>Get Them Fixed.</span>
              </h1>
              <p className="lead mb-4" style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                The Smart Community Issue Management System connects citizens with administrators to resolve road damage, garbage, water leakage, streetlight failures and more — transparently and efficiently.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/register" className="btn btn-primary btn-lg px-4">
                  <i className="bi bi-person-plus me-2"></i>Get Started Free
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg px-4">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
                </Link>
              </div>
              <div className="d-flex gap-4 mt-4">
                {[['500+','Complaints Resolved'],['98%','Satisfaction Rate'],['24h','Avg Response Time']].map(([val, label]) => (
                  <div key={label}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#60a5fa' }}>{val}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-flex justify-content-center">
              <div style={{ position: 'relative', width: 420 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }}></div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div>
                    <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: 8 }}>complaint-tracker.app</span>
                  </div>
                  {[
                    { id: '#1042', title: 'Pothole on Main St', status: 'IN PROGRESS', color: '#3b82f6' },
                    { id: '#1038', title: 'Broken Streetlight', status: 'RESOLVED',    color: '#22c55e' },
                    { id: '#1045', title: 'Water Pipe Burst',   status: 'PENDING',     color: '#eab308' },
                  ].map(item => (
                    <div key={item.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.625rem', padding: '0.75rem 1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{item.id}</div>
                        <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>{item.title}</div>
                      </div>
                      <span style={{ background: `${item.color}22`, color: item.color, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600 }}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ background: '#0f172a', padding: '5rem 0' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-white mb-3">Everything You Need</h2>
            <p style={{ color: '#64748b' }}>A complete platform for citizens and administrators</p>
          </div>
          <div className="row g-4">
            {features.map((f) => (
              <div key={f.title} className="col-md-6 col-lg-4">
                <div className="feature-card h-100">
                  <div className="feature-icon"><i className={`bi ${f.icon}`}></i></div>
                  <h5 className="fw-bold mb-2">{f.title}</h5>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" style={{ background: '#1e293b', padding: '5rem 0' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-white mb-3">Complaint Categories</h2>
            <p style={{ color: '#64748b' }}>We handle all types of community issues</p>
          </div>
          <div className="row g-3">
            {categories.map((c) => (
              <div key={c.name} className="col-6 col-md-3">
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center', transition: 'all 0.2s' }}
                  className="cursor-pointer"
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                  <div style={{ fontSize: '1.75rem', color: c.color, marginBottom: '0.5rem' }}>
                    <i className={`bi ${c.icon}`}></i>
                  </div>
                  <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.875rem' }}>{c.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ background: '#0f172a', padding: '5rem 0' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-white mb-3">How It Works</h2>
            <p style={{ color: '#64748b' }}>Simple 4-step process to get your issue resolved</p>
          </div>
          <div className="row g-4">
            {steps.map((s, i) => (
              <div key={s.step} className="col-md-6 col-lg-3">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(37,99,235,0.2)', border: '2px solid rgba(37,99,235,0.4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa', marginBottom: '1rem' }}>
                    {s.step}
                  </div>
                  <h5 className="text-white fw-bold mb-2">{s.title}</h5>
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', padding: '4rem 0' }}>
        <div className="container text-center">
          <h2 className="fw-bold text-white mb-3">Ready to Report an Issue?</h2>
          <p className="text-white-50 mb-4">Join thousands of citizens making their community better.</p>
          <Link to="/register" className="btn btn-light btn-lg px-5">
            <i className="bi bi-person-plus me-2"></i>Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem 0' }}>
        <div className="container text-center">
          <div className="fw-bold text-white mb-1">
            <i className="bi bi-building me-2 text-primary"></i>SCIMS
          </div>
          <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0 }}>
            Smart Community Issue Management System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
