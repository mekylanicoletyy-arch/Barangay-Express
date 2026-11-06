export const inp = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-navy'
export const btn = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50'
export const btnP = 'rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90'
export const STATUS = ['Pending', 'Processing', 'Approved', 'Ready for Pick-Up', 'Rejected']
export const TYPES = ['Barangay Clearance', 'Certificate of Indigency', 'Certificate of Residency']
export const NEXT = {Pending: 'Awaiting staff review', Processing: 'Requirements under review', Approved: 'Preparing your document', 'Ready for Pick-Up': 'Bring your original ID to the office', Rejected: 'See staff note'}
export const fmt = t => t?.toDate ? t.toDate().toLocaleDateString('en-PH', {day: '2-digit', month: 'short', year: 'numeric'}) : '…'
export const Card = ({title, sub, children}) => (
  <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
    {title && <h3 className="font-semibold">{title}</h3>}{sub && <p className="text-sm text-slate-500">{sub}</p>}{children}
  </section>)
export const Stat = ({label, value}) => <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-sm text-slate-500">{label}</div><div className="text-3xl font-bold">{value}</div></div>
export const Badge = ({s}) => <span className={'rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold ' + (s === 'Rejected' ? 'text-red-700' : s === 'Pending' ? 'text-amber-700' : s === 'Processing' ? 'text-navy' : 'text-green-700')}>{s}</span>
export const Table = ({heads, rows}) => (
  <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm">
    <thead><tr>{heads.map(h => <th key={h} className="p-2 text-xs uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-slate-100">{r.map((c, j) => <td key={j} className="whitespace-nowrap p-2">{c}</td>)}</tr>)}</tbody>
  </table>{!rows.length && <p className="p-2 text-sm text-slate-500">Nothing here yet.</p>}</div>)
export const Head = ({eb, h, p}) => <div className="mb-4"><div className="text-xs font-semibold uppercase tracking-widest text-slate-500">{eb}</div><h1 className="text-2xl font-bold">{h}</h1>{p && <p className="text-sm text-slate-500">{p}</p>}</div>
