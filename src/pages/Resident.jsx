import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where} from 'firebase/firestore'
import {db} from '../firebase'
import {useAuth} from '../App'
import {Badge, Card, Head, NEXT, Stat, Table, TYPES, btn, btnP, fmt, inp} from '../ui'

const FLOW = ['Pending', 'Processing', 'Approved', 'Ready for Pick-Up']
const Steps = ({s}) => {
  const i = FLOW.indexOf(s)
  return <div className="mt-1 flex gap-1">{FLOW.map((x, k) => <span key={x} className={'h-1.5 w-8 rounded ' + (s === 'Rejected' ? 'bg-red-500' : k <= i ? 'bg-navy' : 'bg-slate-200')} />)}</div>
}

export function Dashboard() {
  const {user} = useAuth(), nav = useNavigate(), [reqs, setReqs] = useState([]), [sel, setSel] = useState(null)
  // READ (realtime): live updates without refresh
  useEffect(() => onSnapshot(query(collection(db, 'requests'), where('uid', '==', user.uid)),
    s => setReqs(s.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (b.createdAt?.seconds || 9e9) - (a.createdAt?.seconds || 9e9)))), [user.uid])
  const n = f => reqs.filter(f).length, ready = n(r => r.status === 'Ready for Pick-Up')
  // UPDATE: edit purpose while still Pending
  const edit = async r => { const p = prompt('Update purpose of request', r.purpose); if (p && p.trim()) await updateDoc(doc(db, 'requests', r.id), {purpose: p.trim()}) }
  // DELETE: cancel a Pending request and its uploaded files
  const cancel = async r => {
    if (!confirm('Cancel request ' + r.ref + '?')) return
    await deleteDoc(doc(db, 'requests', r.id))
  }
  return <>
    <Head eb="Resident dashboard" h="Your document requests" p="Status updates appear here instantly." />
    {ready > 0 && <div className="mb-4 rounded-xl bg-blue-50 p-4 text-sm font-semibold">🎉 {ready} document(s) ready for pick-up. Bring your original ID to the barangay office.</div>}
    <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      <Stat label="Total requests" value={reqs.length} /><Stat label="In progress" value={n(r => ['Pending', 'Processing'].includes(r.status))} />
      <Stat label="Approved / ready" value={n(r => ['Approved', 'Ready for Pick-Up'].includes(r.status))} /><Stat label="Rejected" value={n(r => r.status === 'Rejected')} />
    </div>
    <Card title="Track status"><button className={btnP + ' mt-2'} onClick={() => nav('/request')}>+ Request new document</button>
      <Table heads={['Reference', 'Document', 'Purpose', 'Date', 'Status', 'Next step', '']} rows={reqs.map(r => [r.ref, r.type, r.purpose, fmt(r.createdAt), <div><Badge s={r.status} /><Steps s={r.status} /></div>, r.note || NEXT[r.status],
        <span className="flex gap-1"><button className={btn} onClick={() => setSel(r.id)}>View details</button>{r.status === 'Pending' && <><button className={btn} onClick={() => edit(r)}>Edit</button><button className={btn} onClick={() => cancel(r)}>Cancel</button></>}</span>])} />
    </Card>
    {reqs.find(r => r.id === sel) && (() => {
      const r = reqs.find(x => x.id === sel), i = FLOW.indexOf(r.status)
      return <Card title={`Progress of ${r.ref}`} sub={`${r.type} · ${r.purpose} · submitted ${fmt(r.createdAt)}`}>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {FLOW.map((x, k) => <div key={x}>
            <div className={'h-2 rounded ' + (r.status === 'Rejected' ? 'bg-red-500' : k <= i ? 'bg-navy' : 'bg-slate-200')} />
            <div className={'mt-1 text-xs ' + (k === i ? 'font-bold text-navy' : 'text-slate-500')}>{x}{k === i && ' (now)'}</div>
          </div>)}
        </div>
        {r.status === 'Rejected' && <p className="mt-3 text-sm font-semibold text-red-600">This request was rejected.</p>}
        <p className="mt-3 text-sm"><b>Next step:</b> {NEXT[r.status]}</p>
        {r.note && <p className="mt-1 text-sm"><b>Staff note:</b> {r.note}</p>}
        <div className="mt-3 flex flex-wrap gap-2">{(r.files || []).map(f => <img key={f.name} src={f.url} alt={f.name} className="h-20 rounded border" />)}</div>
      </Card>
    })()}
  </>
}

// Free alternative to Firebase Storage: shrink the photo and keep it inside Firestore
const toData = f => new Promise((res, rej) => {
  const img = new Image(), u = URL.createObjectURL(f)
  img.onload = () => {
    const s = Math.min(1, 700 / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = img.width * s; c.height = img.height * s
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    URL.revokeObjectURL(u)
    res({name: f.name, url: c.toDataURL('image/jpeg', 0.6)})
  }
  img.onerror = () => rej(new Error('Cannot read ' + f.name + '. Please use a JPG or PNG photo.'))
  img.src = u
})

export function NewRequest() {
  const {user, profile} = useAuth(), nav = useNavigate()
  const [type, setType] = useState(TYPES[0]), [purpose, setPurpose] = useState(''), [files, setFiles] = useState([]), [ok, setOk] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  // CREATE: upload attachments to Storage, then save request to Firestore
  async function submit(e) {
    e.preventDefault(); setErr('')
    if (!purpose.trim()) return setErr('Please enter the purpose.')
    if (!files.length) return setErr('Attach at least your valid ID.')
    if (files.length > 3) return setErr('Maximum of 3 photos.')
    if (!ok) return setErr('Please confirm your details are accurate.')
    setBusy(true)
    try {
      const up = await Promise.all([...files].map(toData))
      await addDoc(collection(db, 'requests'), {ref: 'BE-' + Date.now().toString().slice(-6), uid: user.uid, residentName: profile.name, type, purpose: purpose.trim(), status: 'Pending', note: '', files: up, createdAt: serverTimestamp()})
      nav('/dashboard')
    } catch (e2) { setErr(e2.message); setBusy(false) }
  }
  return <form onSubmit={submit}><Head eb="Resident workspace" h="Request a document" p="Fees, if any, are paid at the barangay office on pick-up." />
    <Card><label className="text-xs font-semibold">Document type</label><select className={inp} value={type} onChange={e => setType(e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
      <label className="mt-3 block text-xs font-semibold">Purpose of request</label><input className={inp} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Employment requirement" />
      <label className="mt-3 block text-xs font-semibold">Valid ID, 2x2 photo, proof of residency (JPG or PNG photos, max 3)</label><input type="file" multiple accept="image/*" className={inp} onChange={e => setFiles(e.target.files)} />
      <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />I confirm my details and uploaded documents are accurate.</label>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      <button className={btnP + ' mt-4'} disabled={busy}>{busy ? 'Uploading…' : 'Submit request'}</button></Card></form>
}
