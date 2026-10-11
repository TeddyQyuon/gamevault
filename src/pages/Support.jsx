import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FAQS } from '../data/faqs.js'
import { Breadcrumbs } from '../components/ui/controls.jsx'
import { KeyRound, ShieldCheck } from 'lucide-react'
import ContactSupport from '../components/support/ContactSupport.jsx'
export default function Support() {
  const [q,setQ] = useState('')
  const list = FAQS.filter(f=>`${f.q} ${f.a}`.toLowerCase().includes(q.trim().toLowerCase()))
  return <div>
    <Breadcrumbs trail={[{label:'Home',to:'/'},{label:'Help & delivery'}]}/>
    <h1 className="text-3xl font-extrabold">Help & delivery</h1>
    <p className="mt-3 text-sm text-[var(--color-muted)]">Check payment and email delivery, or find activation instructions for your membership.</p>
    <a href="#contact-support" className="btn-primary mt-4 inline-block px-5 py-3 text-sm">Contact support</a>
    <div className="mt-7 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
      <section><label className="sr-only" htmlFor="faq-search">Search help topics</label><input id="faq-search" className="input" placeholder="Search help topics…" value={q} onChange={e=>setQ(e.target.value)}/>
        <div className="mt-4 space-y-3">{list.map(f=><details key={f.q} className="card p-5 text-sm"><summary className="cursor-pointer font-bold">{f.q}</summary><p className="mt-3 leading-relaxed text-[var(--color-muted)]">{f.a}</p></details>)}
        {!list.length&&<p className="card p-6 text-sm">No matching topics. Try “code”, “region” or “payment”.</p>}</div>
      </section>
      <aside className="space-y-4"><ContactSupport /><div className="card p-6"><KeyRound size={28}/><h2 className="mt-4 font-bold">Already purchased?</h2><p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">Your order shows payment and delivery status. Subscription details and activation instructions arrive at your checkout email within 1 hour after confirmed payment.</p><Link className="btn-primary mt-5 inline-block px-5 py-3 text-sm" to="/account/orders">Open your orders</Link></div><div className="card p-6"><ShieldCheck size={28}/><h2 className="mt-4 font-bold">Keep your details private</h2><p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">Follow the activation instructions in your delivery email. Keep account details, activation codes and guest order links private. Share only your order number when asking for help.</p></div></aside>
    </div>
  </div>
}
