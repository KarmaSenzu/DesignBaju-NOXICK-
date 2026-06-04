'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { PencilIcon, TrashIcon, UserPlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const roleColors = {
  developer: 'bg-red-500/20 text-red-400 border-red-500/30',
  manager: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  user: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function AdminUsersPage() {
  const { currentUser } = useAuth();
  const [userList, setUserList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Fetch users from database
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUserList(data); })
      .catch(() => {});
  }, []);

  if (!currentUser || currentUser.role !== 'developer') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Akses Ditolak</h1>
        <Link href="/" className="btn-primary">Kembali</Link>
      </div>
    );
  }

  const filtered = userList.filter(u => {
    const matchSearch = !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleDelete = async (id) => {
    setUserList(prev => prev.filter(u => u.id !== id));
    try {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    setUserList(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: newRole }),
      });
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manage Users</h1>
          <p className="text-slate-500 mt-1">{filtered.length} users</p>
        </div>
        <button className="btn-primary">
          <UserPlusIcon className="w-5 h-5" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" placeholder="Cari user..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-12" />
        </div>
        <div className="flex gap-2">
          {['all', 'developer', 'manager', 'user'].map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filterRole === role ? 'text-slate-800' : 'text-slate-500'}`}
              style={filterRole === role
                ? { background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)' }
                : { background: '#F1F3F9', border: '1px solid rgba(108, 60, 225, 0.1)' }
              }
            >
              {role === 'all' ? 'Semua' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500" style={{ borderBottom: '1px solid rgba(108, 60, 225, 0.1)' }}>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="table-row">
                  <td className="p-4 text-slate-400 font-mono text-xs">#{user.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-slate-800" style={{ background: `linear-gradient(135deg, ${user.role === 'developer' ? '#EF4444, #F87171' : user.role === 'manager' ? '#6C3CE1, #8B5CF6' : '#10B981, #34D399'})` }}>
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">{user.email}</td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className="input-field text-xs py-1.5 px-2 w-auto capitalize"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="developer">Developer</option>
                    </select>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">{user.created_at}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-all">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
