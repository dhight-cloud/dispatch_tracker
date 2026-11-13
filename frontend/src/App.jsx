import React, { useState, useEffect } from 'react';
import API from './api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Ticket Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [formError, setFormError] = useState('');

  // Technician Modal State (Updated with full schema fields)
  const [showTechModal, setShowTechModal] = useState(false);
  const [techName, setTechName] = useState('');
  const [techEmail, setTechEmail] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techSkill, setTechSkill] = useState('');
  const [techStatus, setTechStatus] = useState('active');
  const [techRegion, setTechRegion] = useState('North');

  useEffect(() => {
    if (token) {
      fetchTickets();
      fetchTechnicians();
    }
  }, [token, statusFilter, priorityFilter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await API.post('/auth/login', { email, password });
      const jwt = response.data.token;
      localStorage.setItem('token', jwt);
      setToken(jwt);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setTickets([]);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const response = await API.get('/tickets', { params });
      setTickets(response.data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await API.get('/technicians');
      setTechnicians(response.data.technicians || response.data || []);
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
    }
  };

  const handleUpdateTicket = async (id, updatedFields) => {
    try {
      await API.put(`/tickets/${id}`, updatedFields);
      fetchTickets();
    } catch (err) {
      alert('Failed to update ticket: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await API.post('/tickets', { title: newTitle, description: newDesc, priority: newPriority });
      setShowModal(false);
      setNewTitle(''); setNewDesc(''); setNewPriority('normal');
      fetchTickets();
    } catch (err) {
      setFormError('Failed to create ticket');
    }
  };

  const handleCreateTech = async (e) => {
    e.preventDefault();
    try {
      const autoEmail = techEmail || `${techName.trim().toLowerCase().replace(/\s+/g, '.')}@logistics.com`;
      await API.post('/technicians', { 
        name: techName, 
        email: autoEmail, 
        phone: techPhone, 
        specialization: techSkill,
        status: techStatus,
        region: techRegion
      });

      setShowTechModal(false);
      setTechName(''); setTechEmail(''); setTechPhone(''); setTechSkill('');
      setTechStatus('active'); setTechRegion('North');
      fetchTechnicians();
    } catch (err) {
      const msg = err.response?.data?.errors?.map(e => e.msg).join(', ') || err.response?.data?.error || err.message;
      alert('Failed to add technician: ' + msg);
    }
  };

  // KPI Calculations
  const emergencyCount = tickets.filter(t => t.priority === 'emergency').length;
  const unassignedCount = tickets.filter(t => t.status === 'unassigned').length;
  const inProgressCount = tickets.filter(t => ['dispatched', 'en_route', 'on_site'].includes(t.status)).length;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl mb-3 shadow-md">DT</div>
            <h2 className="text-2xl font-bold text-slate-900">Dispatch Tracker API</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to access the operational dispatch control panel</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">DT</div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-none">Dispatch Operations Dashboard</h1>
            <span className="text-xs text-slate-500 font-medium">Enterprise Control Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowTechModal(true)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-300 transition-colors">+ Add Technician</button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm">+ Create Ticket</button>
          <button onClick={handleLogout} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg border border-slate-300 transition-colors">Log Out</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Active Queue</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">{tickets.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Emergencies</p>
            <p className="text-3xl font-extrabold text-red-600 mt-2">{emergencyCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Unassigned</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-2">{unassignedCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">In Field Dispatch</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">{inProgressCount}</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status Filter</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                <option value="">All Statuses</option>
                <option value="unassigned">Unassigned</option>
                <option value="dispatched">Dispatched</option>
                <option value="en_route">En Route</option>
                <option value="on_site">On Site</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Priority Filter</label>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                <option value="">All Priorities</option>
                <option value="emergency">Emergency</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>
          <button onClick={fetchTickets} className="text-xs font-medium bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 transition-colors">Refresh Queue</button>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Tech</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400">Loading queue...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400">No tickets matching selected filters.</td></tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-500">#{t.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{t.title}</td>
                    <td className="py-3.5 px-4"><PriorityBadge priority={t.priority} /></td>
                    
                    <td className="py-3.5 px-4">
                      <select value={t.status} onChange={(e) => handleUpdateTicket(t.id, { status: e.target.value })} className="bg-slate-50 border border-slate-300 text-slate-800 rounded px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-indigo-600">
                        <option value="unassigned">Unassigned</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="en_route">En Route</option>
                        <option value="on_site">On Site</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <select value={t.assigned_tech_id || ''} onChange={(e) => handleUpdateTicket(t.id, { assigned_tech_id: e.target.value ? Number(e.target.value) : null })} className="bg-slate-50 border border-slate-300 text-slate-800 rounded px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-indigo-600">
                        <option value="">-- Unassigned --</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name || `Tech #${tech.id}`} {tech.region ? `(${tech.region})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Technician Profile Modal (Full Schema) */}
      {showTechModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Add Technician Profile</h3>
            <form onSubmit={handleCreateTech} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input type="text" required value={techName} onChange={(e) => setTechName(e.target.value)} placeholder="Marcus Vance" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" value={techEmail} onChange={(e) => setTechEmail(e.target.value)} placeholder="m.vance@logistics.com" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                  <input type="text" value={techPhone} onChange={(e) => setTechPhone(e.target.value)} placeholder="615-555-0142" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Region</label>
                  <select value={techRegion} onChange={(e) => setTechRegion(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900">
                    <option value="North">North Region</option>
                    <option value="South">South Region</option>
                    <option value="East">East Region</option>
                    <option value="West">West Region</option>
                    <option value="Central">Central Region</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Specialization</label>
                  <input type="text" value={techSkill} onChange={(e) => setTechSkill(e.target.value)} placeholder="Fiber Optics & Node Balancing" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select value={techStatus} onChange={(e) => setTechStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTechModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">Save Technician Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Create Service Ticket</h3>
            {formError && <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg">{formError}</div>}
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea rows="3" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    emergency: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-amber-100 text-amber-800 border-amber-200',
    normal: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[priority] || styles.normal}`}>
      {priority}
    </span>
  );
}