import {useEffect, useState} from 'react'
import {collection, deleteDoc, doc, onSnapshot, updateDoc} from 'firebase/firestore'
import {deleteObject, ref} from 'firebase/storage'
import {db, storage, addLog} from '../firebase'
import {useAuth} from '../App'
import {Badge, Card, Head, Stat, STATUS, Table, TYPES, btn, fmt, inp} from '../ui'

export const useCol = name => {
  const [rows, setRows] = useState([])
  useEffect(() => onSnapshot(collection(db, name), s => setRows(s.docs.map(d => ({id: d.id, ...d.data()})))), [name])
  return rows
}

export function AdminDashboard() {
  const {profile} = useAuth(), all = useCol('requests'), [q, setQ] = useState(''), [t, setT] = useState('')
  const reqs = all.sort((a, b) => (b.createdAt?.seconds || 9e9) - (a.createdAt?.seconds || 9e9))
    .filter(r => (!t || r.type === t) && (!q || (r.residentName + r.ref).toLowerCase().includes(q.toLowerCase())))
  // UPDATE: change status / add note, and write an audit log entry
  const setStatus = async (r, status) => {
    const note = prompt('Note to resident (optional)', r.note || '') ?? r.note
    await updateDoc(doc(db, 'requests', r.id), {status, note})
    addLog(`${r.ref} set to ${status}`, profile.name)
  }
  // DELETE (captain only per security rules)
  const remove = async r => {
    if (!confirm('Delete ' + r.ref + '?')) return
    await deleteDoc(doc(db, 'requests', r.id))
    (r.files || []).forEach(f => deleteObject(ref(storage, f.path)).catch(() => {}))
    addLog(`${r.ref} deleted`, profile.name)
  }
  const n = f => all.filter(f).length
  return <>
    <Head eb="Staff workspace" h="Document request queue" p="Review submissions, verify attachments, and record a decision." />
    <div className="mb-4 grid grid-cols-3 gap-4"><Stat label="Total requests" value={all.length} /><Stat label="Pending approvals" value={n(r => r.status === 'Pending')} /><Stat label="Completed" value={n(r => ['Approved', 'Ready for Pick-Up'].includes(r.status))} /></div>
    <Card title="Incoming resident requests">
      <div className="mt-3 flex gap-2"><input className={inp} placeholder="Search name or reference" value={q} onChange={e => setQ(e.target.value)} />
        <select className={inp} value={t} onChange={e => setT(e.target.value)}><option value="">All document types</option>{TYPES.map(x => <option key={x}>{x}</option>)}</select></div>
      <Table heads={['Resident', 'Document', 'Date', 'Attachments', 'Status', 'Update']} rows={reqs.map(r => [<>{r.residentName}<div className="text-xs text-slate-500">{r.ref}</div></>, r.type, fmt(r.createdAt),
        (r.files || []).map(f => <a key={f.path} href={f.url} target="_blank" rel="noreferrer" className="mr-2 text-navy underline">{f.name.slice(-18)}</a>), <Badge s={r.status} />,
        <span className="flex gap-1"><select className={btn} value={r.status} onChange={e => setStatus(r, e.target.value)}>{STATUS.map(s => <option key={s}>{s}</option>)}</select>
          {profile.role === 'captain' && <button className={btn} onClick={() => remove(r)}>Delete</button>}</span>])} />
    </Card></>
}

export function Residents() {
  const {profile} = useAuth(), users = useCol('users').filter(u => u.role === 'resident'), [q, setQ] = useState('')
  const rows = users.filter(u => (u.name + u.address + u.email).toLowerCase().includes(q.toLowerCase()))
  // UPDATE resident record / DELETE (captain only)
  const edit = async u => {
    const name = prompt('Full name', u.name); if (!name) return
    const address = prompt('Address', u.address); if (!address) return
    await updateDoc(doc(db, 'users', u.id), {name, address}); addLog('Resident record updated: ' + name, profile.name)
  }
  const remove = async u => { if (confirm('Delete resident record of ' + u.name + '?')) { await deleteDoc(doc(db, 'users', u.id)); addLog('Resident record deleted: ' + u.name, profile.name) } }
  return <><Head eb="Staff workspace" h="Master resident database" />
    <Card><input className={inp} placeholder="Search name, address or email" value={q} onChange={e => setQ(e.target.value)} />
      <Table heads={['Name', 'Address', 'Email', 'Registered', '']} rows={rows.map(u => [u.name, u.address, u.email, fmt(u.createdAt),
        <span className="flex gap-1"><button className={btn} onClick={() => edit(u)}>Edit</button>{profile.role === 'captain' && <button className={btn} onClick={() => remove(u)}>Delete</button>}</span>])} /></Card></>
}
