import {createContext, useContext, useEffect, useState} from 'react'
import {BrowserRouter, Routes, Route, Navigate, NavLink, Outlet} from 'react-router-dom'
import {onAuthStateChanged, signOut} from 'firebase/auth'
import {doc, onSnapshot} from 'firebase/firestore'
import {auth, db} from './firebase'
import Login from './pages/Login'
import {Dashboard, NewRequest} from './pages/Resident'
import {AdminDashboard, Residents} from './pages/Admin'
import Captain from './pages/Captain'

const Ctx = createContext()
export const useAuth = () => useContext(Ctx)
export const homeOf = r => (r === 'resident' ? '/dashboard' : r === 'staff' ? '/admin-dashboard' : '/captain')

function Provider({children}) {
  const [user, setUser] = useState(undefined)
  const [profile, setProfile] = useState(null)
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); if (!u) setProfile(null) }), [])
  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.exists() ? {id: s.id, ...s.data()} : null))
  }, [user])
  const loading = user === undefined || (!!user && !profile)
  return <Ctx.Provider value={{user, profile, loading}}>{children}</Ctx.Provider>
}

// Protected route: only allowed roles may enter
function Guard({roles}) {
  const {profile, loading} = useAuth()
  if (loading) return <p className="p-8 text-slate-500">Loading…</p>
  if (!profile) return <Navigate to="/login" replace />
  if (!roles.includes(profile.role)) return <Navigate to={homeOf(profile.role)} replace />
  return <Layout />
}

const LINKS = {
  resident: [['/dashboard', 'Dashboard'], ['/request', 'Request Document']],
  staff: [['/admin-dashboard', 'Dashboard'], ['/residents', 'Residents']],
  captain: [['/captain', 'Analytics'], ['/admin-dashboard', 'Requests'], ['/residents', 'Residents']],
}
function Layout() {
  const {profile} = useAuth()
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <header className="flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-navy text-white">B</span>Barangay Express</div>
        <nav className="flex flex-1 gap-1">
          {LINKS[profile.role].map(([to, t]) => <NavLink key={to} to={to} className={({isActive}) => 'px-3 py-2 text-sm font-medium ' + (isActive ? 'border-b-2 border-navy text-navy' : 'text-slate-500')}>{t}</NavLink>)}
        </nav>
        <span className="text-sm text-slate-500">{profile.name} · {profile.role}</span>
        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold" onClick={() => signOut(auth)}>Logout</button>
      </header>
      <main className="mx-auto max-w-5xl p-6"><Outlet /></main>
    </div>)
}

function Root() {
  const {profile, loading} = useAuth()
  if (loading) return <p className="p-8 text-slate-500">Loading…</p>
  return <Navigate to={profile ? homeOf(profile.role) : '/login'} replace />
}

export default function App() {
  return (
    <Provider><BrowserRouter><Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route element={<Guard roles={['resident']} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/request" element={<NewRequest />} />
      </Route>
      <Route element={<Guard roles={['staff', 'captain']} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/residents" element={<Residents />} />
      </Route>
      <Route element={<Guard roles={['captain']} />}>
        <Route path="/captain" element={<Captain />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></BrowserRouter></Provider>)
}
