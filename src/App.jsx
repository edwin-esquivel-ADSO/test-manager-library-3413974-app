import React, { useState, useEffect } from 'react';
import api from './api';
import { 
  BookOpen, Users, Clock, AlertTriangle, BarChart3, LogOut, 
  Plus, CheckCircle, RefreshCw, Trash2, Edit, Search, BookMarked, UserCheck, ShieldAlert 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('books');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Data states
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [booksSearch, setBooksSearch] = useState('');
  const [booksCategory, setBooksCategory] = useState('');
  
  const [members, setMembers] = useState([]);
  const [membersSearch, setMembersSearch] = useState('');

  const [loans, setLoans] = useState([]);
  const [overdueLoans, setOverdueLoans] = useState([]);

  const [librarians, setLibrarians] = useState([]);

  const [reportData, setReportData] = useState([]);
  const [reportDates, setReportDates] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Modal / Form states
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category_id: '', total_copies: 1 });

  // Edit Book state (HU-03 / PUT)
  const [editingBook, setEditingBook] = useState(null);

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ full_name: '', document_number: '' });

  const [showCreateLoan, setShowCreateLoan] = useState(false);
  const [newLoan, setNewLoan] = useState({ member_id: '', items: [{ book_id: '' }] });

  // Librarian form
  const [newLibrarian, setNewLibrarian] = useState({ username: '', password: '', role: 'librarian' });

  // Helpers
  const showFeedback = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4500);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', loginForm);
      const data = { username: loginForm.username, role: res.data.role };
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      showFeedback(`Bienvenido ${data.username} (${data.role})`);
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al iniciar sesión', true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Fetch functions
  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !newBook.category_id) {
        setNewBook((prev) => ({ ...prev, category_id: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBooks = async () => {
    try {
      const params = {};
      if (booksSearch) params.q = booksSearch;
      if (booksCategory) params.category_id = booksCategory;
      const res = await api.get('/books', { params });
      setBooks(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMembers = async () => {
    try {
      const params = {};
      if (membersSearch) params.q = membersSearch;
      const res = await api.get('/members', { params });
      setMembers(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLoans = async () => {
    try {
      const res = await api.get('/loans');
      setLoans(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOverdue = async () => {
    try {
      const res = await api.get('/loans/overdue');
      setOverdueLoans(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLibrarians = async () => {
    try {
      const res = await api.get('/users');
      setLibrarians(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReport = async () => {
    try {
      const res = await api.get('/reports/most-borrowed', {
        params: { from: reportDates.from, to: reportDates.to }
      });
      setReportData(res.data.rows || []);
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al cargar reporte', true);
    }
  };

  useEffect(() => {
    if (user) {
      loadCategories();
      loadBooks();
      loadMembers();
      loadLoans();
      loadOverdue();
      if (user.role === 'admin') {
        loadReport();
        loadLibrarians();
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) loadBooks();
  }, [booksSearch, booksCategory]);

  useEffect(() => {
    if (user) loadMembers();
  }, [membersSearch]);

  // Create Book
  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/books', {
        ...newBook,
        total_copies: parseInt(newBook.total_copies, 10),
      });
      showFeedback('Libro registrado con éxito');
      setShowAddBook(false);
      setNewBook({ title: '', author: '', isbn: '', category_id: categories[0]?.id || '', total_copies: 1 });
      loadBooks();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al crear libro', true);
    }
  };

  // Update Book (PUT /books/{id} - CA-03.3)
  const handleUpdateBook = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/books/${editingBook.id}`, {
        title: editingBook.title,
        author: editingBook.author,
        category_id: editingBook.category_id,
        total_copies: parseInt(editingBook.total_copies, 10),
      });
      showFeedback('Libro actualizado exitosamente');
      setEditingBook(null);
      loadBooks();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al actualizar libro', true);
    }
  };

  // Delete Book (Baja lógica - CA-03.5)
  const handleDeleteBook = async (id, title) => {
    if (!window.confirm(`¿Seguro que deseas dar de baja el libro «${title}»?`)) return;
    try {
      await api.delete(`/books/${id}`);
      showFeedback(`Libro «${title}» dado de baja`);
      loadBooks();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al dar de baja el libro', true);
    }
  };

  // Create Member
  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      await api.post('/members', newMember);
      showFeedback('Socio registrado con éxito');
      setShowAddMember(false);
      setNewMember({ full_name: '', document_number: '' });
      loadMembers();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al crear socio', true);
    }
  };

  // Create Loan
  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      const validItems = newLoan.items.filter((it) => it.book_id.trim() !== '');
      if (validItems.length === 0) {
        showFeedback('Selecciona al menos un libro para el préstamo', true);
        return;
      }
      await api.post('/loans', {
        member_id: newLoan.member_id,
        items: validItems,
      });
      showFeedback('Préstamo registrado exitosamente (14 días asignados)');
      setShowCreateLoan(false);
      setNewLoan({ member_id: '', items: [{ book_id: '' }] });
      loadLoans();
      loadBooks();
      loadOverdue();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al registrar préstamo', true);
    }
  };

  // Return Item
  const handleReturnItem = async (loanId, itemId, bookTitle) => {
    try {
      await api.post(`/loans/${loanId}/items/${itemId}/return`);
      showFeedback(`Ejemplar devuelto: «${bookTitle}» (+1 disponible)`);
      loadLoans();
      loadBooks();
      loadOverdue();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al devolver libro', true);
    }
  };

  // Create Librarian (Admin - CA-02)
  const handleCreateLibrarian = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newLibrarian);
      showFeedback(`Bibliotecario «${newLibrarian.username}» dado de alta`);
      setNewLibrarian({ username: '', password: '', role: 'librarian' });
      loadLibrarians();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al dar de alta bibliotecario', true);
    }
  };

  // Delete Librarian (Admin)
  const handleDeleteLibrarian = async (id, username) => {
    if (!window.confirm(`¿Dar de baja al bibliotecario «${username}»?`)) return;
    try {
      await api.delete(`/users/${id}`);
      showFeedback(`Bibliotecario «${username}» dado de baja`);
      loadLibrarians();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Error al dar de baja', true);
    }
  };

  // Login Screen
  if (!user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <BookOpen size={48} color="#38bdf8" style={{ margin: '0 auto 0.5rem' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Manager Library</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Sistema de Gestión de Biblioteca · SDD</p>
          </div>

          {errorMsg && (
            <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#cbd5e1' }}>Usuario</label>
              <input 
                type="text" 
                required 
                style={{ width: '100%' }}
                placeholder="admin o bibliotecario"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#cbd5e1' }}>Contraseña</label>
              <input 
                type="password" 
                required 
                style={{ width: '100%' }}
                placeholder="********"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.65rem' }}>
              Ingresar al Sistema
            </button>
          </form>
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
            Demostración: Admin (<code>admin</code> / <code>Admin123*</code>)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={28} color="#38bdf8" />
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Manager Library</h2>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ficha ADSO 3413974 · React + Laravel</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', background: '#334155', padding: '0.3rem 0.75rem', borderRadius: '9999px' }}>
            {user.username} (<strong>{user.role}</strong>)
          </span>
          <button className="btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Nav */}
        <nav style={{ width: '230px', background: '#0f172a', borderRight: '1px solid #334155', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            className={`btn-secondary ${activeTab === 'books' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('books')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left' }}
          >
            <BookMarked size={18} /> Catálogo Libros
          </button>

          <button 
            className={`btn-secondary ${activeTab === 'members' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('members')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left' }}
          >
            <Users size={18} /> Socios
          </button>

          <button 
            className={`btn-secondary ${activeTab === 'loans' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('loans')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left' }}
          >
            <Clock size={18} /> Préstamos
          </button>

          <button 
            className={`btn-secondary ${activeTab === 'overdue' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('overdue')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left' }}
          >
            <AlertTriangle size={18} /> Libros Vencidos
            {overdueLoans.length > 0 && (
              <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontSize: '0.7rem' }}>
                {overdueLoans.length}
              </span>
            )}
          </button>

          {user.role === 'admin' && (
            <>
              <button 
                className={`btn-secondary ${activeTab === 'librarians' ? 'btn-primary' : ''}`}
                onClick={() => setActiveTab('librarians')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left' }}
              >
                <UserCheck size={18} /> Bibliotecarios
              </button>

              <button 
                className={`btn-secondary ${activeTab === 'reports' ? 'btn-primary' : ''}`}
                onClick={() => setActiveTab('reports')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left' }}
              >
                <BarChart3 size={18} /> Reporte Préstamos
              </button>
            </>
          )}
        </nav>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          {errorMsg && (
            <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', color: '#fecaca', padding: '0.75rem 1rem', borderRadius: '0.375rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#14532d', border: '1px solid #22c55e', color: '#bbf7d0', padding: '0.75rem 1rem', borderRadius: '0.375rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              ✓ {successMsg}
            </div>
          )}

          {/* TAB 1: BOOKS */}
          {activeTab === 'books' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Catálogo de Libros</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Consulta y disponibilidad en tiempo real con edición y baja lógica (HU-03 / HU-04).</p>
                </div>
                {user.role === 'admin' && (
                  <button className="btn-primary" onClick={() => setShowAddBook(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={18} /> Nuevo Libro
                  </button>
                )}
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Buscar por título o autor..." 
                    style={{ width: '100%', paddingLeft: '2.2rem' }}
                    value={booksSearch}
                    onChange={(e) => setBooksSearch(e.target.value)}
                  />
                  <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.65rem', top: '0.6rem' }} />
                </div>
                <select 
                  value={booksCategory} 
                  onChange={(e) => setBooksCategory(e.target.value)}
                  style={{ minWidth: '180px' }}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Autor</th>
                      <th>ISBN</th>
                      <th>Categoría</th>
                      <th>Total</th>
                      <th>Disponibles</th>
                      {user.role === 'admin' && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {books.length === 0 ? (
                      <tr>
                        <td colSpan={user.role === 'admin' ? 7 : 6} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                          No se encontraron libros activos.
                        </td>
                      </tr>
                    ) : (
                      books.map((b) => (
                        <tr key={b.id}>
                          <td><strong>{b.title}</strong></td>
                          <td>{b.author}</td>
                          <td><code>{b.isbn}</code></td>
                          <td><span className="badge badge-open">{b.category.name}</span></td>
                          <td>{b.total_copies}</td>
                          <td>
                            <strong style={{ color: b.available_copies > 0 ? '#4ade80' : '#f87171' }}>
                              {b.available_copies}
                            </strong>
                          </td>
                          {user.role === 'admin' && (
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button 
                                  className="btn-secondary" 
                                  onClick={() => setEditingBook({
                                    id: b.id,
                                    title: b.title,
                                    author: b.author,
                                    category_id: b.category.id,
                                    total_copies: b.total_copies,
                                    available_copies: b.available_copies
                                  })}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                                >
                                  <Edit size={14} /> Editar
                                </button>
                                <button 
                                  className="btn-danger" 
                                  onClick={() => handleDeleteBook(b.id, b.title)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <Trash2 size={14} /> Baja
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'members' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Socios de la Biblioteca</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Personas registradas para préstamo (máx. 3 libros por socio · Los socios no se eliminan según CA-05.3).</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddMember(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={18} /> Registrar Socio
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o documento..." 
                  style={{ width: '100%', maxWidth: '400px' }}
                  value={membersSearch}
                  onChange={(e) => setMembersSearch(e.target.value)}
                />
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre Completo</th>
                      <th>N° Documento</th>
                      <th>Identificador (UUID)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                          No hay socios registrados.
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m.id}>
                          <td><strong>{m.full_name}</strong></td>
                          <td><code>{m.document_number}</code></td>
                          <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{m.id}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LOANS */}
          {activeTab === 'loans' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Registro de Préstamos</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Hechos consumados inmutables (RN-5): 1 a 3 libros, 14 días. Solo se devuelve por línea.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateLoan(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={18} /> Registrar Préstamo
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha Préstamo</th>
                      <th>Socio</th>
                      <th>Estado Calculado</th>
                      <th>Líneas (Libros Congelados)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                          No hay préstamos registrados.
                        </td>
                      </tr>
                    ) : (
                      loans.map((l) => (
                        <tr key={l.id}>
                          <td>{new Date(l.loaned_at).toLocaleString()}</td>
                          <td><strong>{l.member_name}</strong></td>
                          <td>
                            <span className={`badge badge-${l.status}`}>
                              {l.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {l.items?.map((it) => (
                                <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', padding: '0.4rem 0.6rem', borderRadius: '0.25rem' }}>
                                  <div>
                                    <span style={{ fontWeight: 600 }}>{it.book_title}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                                      ({it.category_name} · Vence: {new Date(it.due_at).toLocaleDateString()})
                                    </span>
                                  </div>
                                  <div>
                                    {it.returned_at ? (
                                      <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                                        ✓ Devuelto ({new Date(it.returned_at).toLocaleDateString()})
                                      </span>
                                    ) : (
                                      <button 
                                        className="btn-success" 
                                        onClick={() => handleReturnItem(l.id, it.id, it.book_title)}
                                      >
                                        Devolver
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: OVERDUE */}
          {activeTab === 'overdue' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Libros Vencidos</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Líneas de préstamo pendientes de entrega tras superar los 14 días reglamentarios.</p>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Libro Congelado</th>
                      <th>Socio</th>
                      <th>Fecha Vencimiento</th>
                      <th>Días de Retraso</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueLoans.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#4ade80', padding: '2rem' }}>
                          ✓ No hay libros vencidos pendientes. Todo está al día.
                        </td>
                      </tr>
                    ) : (
                      overdueLoans.map((o) => (
                        <tr key={o.item_id}>
                          <td><strong>{o.book_title}</strong></td>
                          <td>{o.member_name}</td>
                          <td>{new Date(o.due_at).toLocaleDateString()}</td>
                          <td>
                            <span className="badge badge-overdue">
                              {o.days_late} días
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn-success"
                              onClick={() => handleReturnItem(o.loan_id, o.item_id, o.book_title)}
                            >
                              Devolver
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: LIBRARIANS (ADMIN - HU-02) */}
          {activeTab === 'librarians' && user.role === 'admin' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Gestión de Bibliotecarios (HU-02)</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Dar de alta nuevos bibliotecarios a la izquierda y visualizar los bibliotecarios de alta a la derecha con opción de baja.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Left: Alta de Bibliotecario */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={18} color="#38bdf8" /> Dar de Alta Bibliotecario
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                    El usuario se guardará en minúsculas y recortado. Solo rol <code>librarian</code> permitido (CA-02).
                  </p>
                  <form onSubmit={handleCreateLibrarian} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Nombre de Usuario</label>
                      <input 
                        required 
                        style={{ width: '100%' }} 
                        placeholder="Ej. carlos"
                        value={newLibrarian.username} 
                        onChange={(e) => setNewLibrarian({ ...newLibrarian, username: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Contraseña</label>
                      <input 
                        type="password" 
                        required 
                        style={{ width: '100%' }} 
                        placeholder="********"
                        value={newLibrarian.password} 
                        onChange={(e) => setNewLibrarian({ ...newLibrarian, password: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Rol Asignado</label>
                      <input 
                        type="text" 
                        disabled 
                        style={{ width: '100%', opacity: 0.7 }} 
                        value="librarian" 
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
                      Dar de Alta
                    </button>
                  </form>
                </div>

                {/* Right: Lista de Bibliotecarios de Alta */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <UserCheck size={18} color="#4ade80" /> Bibliotecarios Dados de Alta ({librarians.length})
                  </h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Rol</th>
                          <th>Identificador (UUID)</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {librarians.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                              No hay bibliotecarios registrados aún.
                            </td>
                          </tr>
                        ) : (
                          librarians.map((lib) => (
                            <tr key={lib.id}>
                              <td><strong>{lib.username}</strong></td>
                              <td><span className="badge badge-open">{lib.role}</span></td>
                              <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{lib.id}</td>
                              <td>
                                <button 
                                  className="btn-danger"
                                  onClick={() => handleDeleteLibrarian(lib.id, lib.username)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <Trash2 size={14} /> Dar de Baja
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REPORTS (ADMIN) */}
          {activeTab === 'reports' && user.role === 'admin' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Reporte: Libros Más Prestados</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Agregado inmutable por valores congelados (HU-10 / ADR-004). Protege la privacidad sin exponer socios ni bibliotecarios.
                </p>
              </div>

              {/* Date Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Desde</label>
                  <input 
                    type="date" 
                    value={reportDates.from}
                    onChange={(e) => setReportDates({ ...reportDates, from: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.2rem' }}>Hasta</label>
                  <input 
                    type="date" 
                    value={reportDates.to}
                    onChange={(e) => setReportDates({ ...reportDates, to: e.target.value })}
                  />
                </div>
                <button 
                  className="btn-primary" 
                  onClick={loadReport} 
                  style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RefreshCw size={16} /> Consultar
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Libro (Título Congelado)</th>
                      <th>Categoría (Congelada)</th>
                      <th>Total de Préstamos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                          No hay préstamos en el rango de fechas seleccionado.
                        </td>
                      </tr>
                    ) : (
                      reportData.map((r, i) => (
                        <tr key={i}>
                          <td><strong>{r.book_title}</strong></td>
                          <td><span className="badge badge-open">{r.category_name}</span></td>
                          <td>
                            <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>
                              {r.times_borrowed}
                            </strong>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD BOOK */}
      {showAddBook && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Registrar Nuevo Libro</h3>
            <form onSubmit={handleCreateBook} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Título</label>
                <input required style={{ width: '100%' }} value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Autor</label>
                <input required style={{ width: '100%' }} value={newBook.author} onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>ISBN (13 dígitos numéricos)</label>
                <input required maxLength={13} pattern="\d{13}" style={{ width: '100%' }} placeholder="9780123456789" value={newBook.isbn} onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Categoría</label>
                <select style={{ width: '100%' }} value={newBook.category_id} onChange={(e) => setNewBook({ ...newBook, category_id: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Total de Ejemplares</label>
                <input type="number" min="1" required style={{ width: '100%' }} value={newBook.total_copies} onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddBook(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Libro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BOOK (HU-03 / PUT) */}
      {editingBook && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Editar Libro (HU-03)</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              Cambiar el total ajusta los disponibles en la misma diferencia y nunca deja disponibles &lt; 0 (CA-03.3).
            </p>
            <form onSubmit={handleUpdateBook} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Título</label>
                <input required style={{ width: '100%' }} value={editingBook.title} onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Autor</label>
                <input required style={{ width: '100%' }} value={editingBook.author} onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Categoría</label>
                <select style={{ width: '100%' }} value={editingBook.category_id} onChange={(e) => setEditingBook({ ...editingBook, category_id: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Total de Ejemplares (≥ 1)</label>
                <input type="number" min="1" required style={{ width: '100%' }} value={editingBook.total_copies} onChange={(e) => setEditingBook({ ...editingBook, total_copies: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingBook(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Actualizar Libro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEMBER */}
      {showAddMember && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Registrar Socio</h3>
            <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Nombre Completo</label>
                <input required style={{ width: '100%' }} value={newMember.full_name} onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>N° Documento (Único)</label>
                <input required style={{ width: '100%' }} value={newMember.document_number} onChange={(e) => setNewMember({ ...newMember, document_number: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddMember(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Socio</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE LOAN */}
      {showCreateLoan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Registrar Nuevo Préstamo</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Reglas: 1 a 3 libros sin repetir. El socio no puede superar 3 libros activos ni tener libros vencidos.
            </p>
            <form onSubmit={handleCreateLoan} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Seleccionar Socio</label>
                <select 
                  required 
                  style={{ width: '100%' }}
                  value={newLoan.member_id}
                  onChange={(e) => setNewLoan({ ...newLoan, member_id: e.target.value })}
                >
                  <option value="">-- Seleccionar socio --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.document_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Libros a Prestar (Máximo 3)</label>
                {newLoan.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select 
                      style={{ flex: 1 }}
                      value={item.book_id}
                      onChange={(e) => {
                        const updated = [...newLoan.items];
                        updated[idx].book_id = e.target.value;
                        setNewLoan({ ...newLoan, items: updated });
                      }}
                    >
                      <option value="">-- Seleccionar libro --</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.available_copies <= 0}>
                          {b.title} ({b.available_copies} disponibles)
                        </option>
                      ))}
                    </select>
                    {newLoan.items.length > 1 && (
                      <button 
                        type="button" 
                        className="btn-danger"
                        onClick={() => {
                          const updated = newLoan.items.filter((_, i) => i !== idx);
                          setNewLoan({ ...newLoan, items: updated });
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {newLoan.items.length < 3 && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => setNewLoan({ ...newLoan, items: [...newLoan.items, { book_id: '' }] })}
                  >
                    + Añadir otro libro
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateLoan(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar Préstamo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
