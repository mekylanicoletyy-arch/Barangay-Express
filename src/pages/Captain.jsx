import {useEffect, useState} from 'react'
import {initializeApp} from 'firebase/app'
import {createUserWithEmailAndPassword, getAuth, signOut} from 'firebase/auth'
import {collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc} from 'firebase/firestore'
import {cfg, db, addLog} from '../firebase'
import {useAuth} from '../App'
import {useCol} from './Admin'
import {Card, Head, Stat, Table, TYPES, btn, btnP, fmt, inp} from '../ui'

export default function Captain() {
  const {profile} = useAuth(), reqs = useCol('requests'), users = useCol('users')
  const [logs, setLogs] = useState([]), [f, setF] = useState({name: '', email: '', pw: ''}), [err, setErr] = useState('')
  useEffect(() => onSnapshot(query(collection(db, 'logs'), orderBy('at', 'desc'), limit(30)), s => setLogs(s.docs.map(d => d.data()))), [])
  const staff = users.filter(u => u.role === 'staff')
  const months = {}; reqs.forEach(r => { const d = r.createdAt?.toDate?.(); if (d) { const k = d.toLocaleString('en', {month: 'short'}); months[k] = (months[k] || 0) + 1 } })
  const mx = Math.max(1, ...Object.values(months))

  // CREATE staff: a secondary app instance keeps the captain signed in
  async function add(e) {
    e.preventDefault(); setErr('')
    if (!f.name || !f.email || f.pw.length < 6) return setErr('Complete all fields (password min 6).')
    try {
      const sec = initializeApp(cfg, 'secondary'), sa = getAuth(sec)
      const {user} = await createUserWithEmailAndPassword(sa, f.email, f.pw)
      await signOut(sa)
      await setDoc(doc(db, 'users', user.uid), {name: f.name, email: f.email, role: 'staff', address: 'Barangay Hall', createdAt: serverTimestamp()})
      addLog('Staff account created: ' + f.name, profile.name); setF({name: '', email: '', pw: ''})
    } catch (e2) { setErr(e2.code || e2.message) }
  }
  // UPDATE staff name / DELETE staff record (also revoke access by removing role doc)
  const rename = async u => { const name = prompt('Staff name', u.name); if (name) { await updateDoc(doc(db, 'users', u.id), {name}); addLog('Staff renamed: ' + name, profile.name) } }
  const remove = async u => { if (confirm('Remove ' + u.name + '?')) { await deleteDoc(doc(db, 'users', u.id)); addLog('Staff removed: ' + u.name, profile.name) } }

  return <><Head eb="Barangay Captain / Super Admin" h="Service analytics & account management" />
    <div className="mb-4 grid grid-cols-3 gap-4"><Stat label="Total requests" value={reqs.length} /><Stat label="Residents" value={users.filter(u => u.role === 'resident').length} /><Stat label="Staff accounts" value={staff.length} /></div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Monthly requests"><div className="mt-4 flex h-40 items-end gap-3 border-b border-slate-200">
        {Object.entries(months).map(([m, c]) => <div key={m} className="flex-1 text-center text-xs text-slate-500"><div className="rounded-t bg-navy" style={{height: (c / mx) * 120}} />{m} ({c})</div>)}</div></Card>
      <Card title="Breakdown by document">{TYPES.map(t => { const c = reqs.filter(r => r.type === t).length; return <div key={t} className="mt-3 text-sm"><div className="flex justify-between"><span>{t}</span><b>{c}</b></div><div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-navy" style={{width: (reqs.length ? c / reqs.length * 100 : 0) + '%'}} /></div></div> })}</Card>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Staff management"><Table heads={['Name', 'Email', '']} rows={staff.map(u => [u.name, u.email, <span className="flex gap-1"><button className={btn} onClick={() => rename(u)}>Edit</button><button className={btn} onClick={() => remove(u)}>Remove</button></span>])} /></Card>
      <form onSubmit={add}><Card title="Create staff account">
        <input className={inp + ' mt-3'} placeholder="Full name" value={f.name} onChange={e => setF({...f, name: e.target.value})} />
        <input className={inp + ' mt-2'} placeholder="Work email" value={f.email} onChange={e => setF({...f, email: e.target.value})} />
        <input className={inp + ' mt-2'} placeholder="Temporary password" value={f.pw} onChange={e => setF({...f, pw: e.target.value})} />
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}<button className={btnP + ' mt-3 w-full'}>Create account</button></Card></form>
    </div>
    <Card title="Audit logs"><Table heads={['Time', 'By', 'Event']} rows={logs.map(l => [fmt(l.at), l.by, l.m])} /></Card></>
}
