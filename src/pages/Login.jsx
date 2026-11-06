import {useState} from 'react'
import {Navigate} from 'react-router-dom'
import {createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from 'firebase/auth'
import {doc, setDoc, serverTimestamp} from 'firebase/firestore'
import {auth, db} from '../firebase'
import {useAuth, homeOf} from '../App'
import {inp, btnP, btn} from '../ui'

export default function Login() {
  const {profile} = useAuth()
  const [mode, setMode] = useState('resident'), [reg, setReg] = useState(false), [err, setErr] = useState('')
  const [f, setF] = useState({name: '', address: '', email: '', pw: '', pc: ''})
  const set = k => e => setF({...f, [k]: e.target.value})
  if (profile) return <Navigate to={homeOf(profile.role)} replace />

  async function submit(e) {
    e.preventDefault(); setErr('')
    try {
      if (reg) {
        if (!f.name || !f.address) return setErr('Please complete all fields.')
        if (f.pw.length < 6) return setErr('Password must be at least 6 characters.')
        if (f.pw !== f.pc) return setErr('Passwords do not match.')
        const {user} = await createUserWithEmailAndPassword(auth, f.email, f.pw)
        await setDoc(doc(db, 'users', user.uid), {name: f.name, address: f.address, email: f.email, role: 'resident', createdAt: serverTimestamp()})
      } else await signInWithEmailAndPassword(auth, f.email, f.pw)
    } catch (e2) { setErr(e2.code?.replace('auth/', '').replace(/-/g, ' ') || 'Something went wrong.') }
  }
  return (
    <div className="grid min-h-screen font-sans md:grid-cols-2">
      <div className="flex flex-col justify-between bg-navy p-10 text-white">
        <div className="flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-navy">B</span>Barangay Express</div>
        <div><div className="text-xs font-semibold uppercase tracking-widest opacity-80">Your community, connected</div>
          <h1 className="my-3 text-5xl font-bold leading-tight">Public services,<br />made simpler.</h1>
          <p className="max-w-sm opacity-90">Request your barangay documents online and stay updated every step of the way.</p></div>
        <div className="text-xs opacity-80">A better way to serve our community.</div>
      </div>
      <form onSubmit={submit} className="grid place-items-center bg-white p-8"><div className="w-full max-w-sm">
        {!reg && <div className="mb-5 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {['resident', 'staff'].map(m => <button type="button" key={m} onClick={() => setMode(m)} className={'flex-1 rounded-md py-1.5 text-sm font-semibold ' + (mode === m ? 'bg-navy text-white' : 'text-slate-500')}>{m === 'resident' ? 'Resident' : 'Staff / Admin'}</button>)}</div>}
        <h2 className="text-3xl font-bold">{reg ? 'Create your account' : 'Welcome back'}</h2>
        {reg && <><label className="mt-3 block text-xs font-semibold">Full name</label><input className={inp} value={f.name} onChange={set('name')} />
          <label className="mt-3 block text-xs font-semibold">Residential address</label><input className={inp} value={f.address} onChange={set('address')} /></>}
        <label className="mt-3 block text-xs font-semibold">Email address</label><input type="email" className={inp} value={f.email} onChange={set('email')} />
        <label className="mt-3 block text-xs font-semibold">Password</label><input type="password" className={inp} value={f.pw} onChange={set('pw')} />
        {reg && <><label className="mt-3 block text-xs font-semibold">Confirm password</label><input type="password" className={inp} value={f.pc} onChange={set('pc')} /></>}
        {err && <p className="mt-3 text-sm capitalize text-red-600">{err}</p>}
        <button className={btnP + ' mt-4 w-full'}>{reg ? 'Register resident account' : 'Sign in →'}</button>
        {(reg || mode === 'resident') && <button type="button" className={btn + ' mt-3 w-full py-3'} onClick={() => { setReg(!reg); setErr('') }}>{reg ? 'Back to sign in' : 'Create a resident account'}</button>}
      </div></form>
    </div>)
}
