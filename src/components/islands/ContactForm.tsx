/**
 * ContactForm — static-site friendly.
 *
 *  • If PUBLIC_FORM_ENDPOINT is set (Formspree, Basin, Getform, Web3Forms…)
 *    the form POSTs JSON there and shows an inline success state.
 *  • Otherwise it falls back to opening the visitor's email app with the
 *    message pre-filled — so it works on GitHub Pages with zero setup.
 *
 * Accessible: native labels, inline errors linked with aria-describedby,
 * status announced via aria-live, focus moved to the first invalid field.
 */
import { useId, useRef, useState, type SubmitEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Props = { endpoint?: string; email: string; services: string[] };
type Status = 'idle' | 'sending' | 'sent' | 'error';
type Errors = Partial<Record<'name' | 'email' | 'details', string>>;

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ContactForm({ endpoint, email, services }: Props) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const validate = (data: FormData): Errors => {
    const e: Errors = {};
    if (!String(data.get('name') ?? '').trim()) e.name = 'Please tell us your name.';
    const mail = String(data.get('email') ?? '').trim();
    if (!mail) e.email = 'We’ll need an email to reply.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) e.email = 'That email doesn’t look quite right.';
    if (String(data.get('details') ?? '').trim().length < 10)
      e.details = 'A sentence or two about your business helps us prepare.';
    return e;
  };

  async function onSubmit(ev: SubmitEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const data = new FormData(form);
    if (String(data.get('_gotcha') ?? '')) return; // honeypot

    const found = validate(data);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const payload = {
      name: String(data.get('name')).trim(),
      email: String(data.get('email')).trim(),
      business: String(data.get('business') ?? '').trim(),
      interests: picked.join(', '),
      details: String(data.get('details')).trim(),
    };

    // No endpoint configured → hand off to the visitor's mail app.
    if (!endpoint) {
      const body = [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        payload.business && `Business: ${payload.business}`,
        payload.interests && `Interested in: ${payload.interests}`,
        '',
        payload.details,
      ]
        .filter((l): l is string => typeof l === 'string' && l !== '')
        .join('\n');
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(
        `New project — ${payload.business || payload.name}`,
      )}&body=${encodeURIComponent(body)}`;
      setStatus('sent');
      return;
    }

    try {
      setStatus('sending');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      form.reset();
      setPicked([]);
    } catch {
      setStatus('error');
    }
  }

  const fieldProps = (name: keyof Errors) => ({
    id: `${id}-${name}`,
    name,
    'aria-invalid': errors[name] ? (true as const) : undefined,
    'aria-describedby': errors[name] ? `${id}-${name}-err` : undefined,
    onInput: () => errors[name] && setErrors((e) => ({ ...e, [name]: undefined })),
  });

  const Err = ({ name }: { name: keyof Errors }) =>
    errors[name] ? (
      <p id={`${id}-${name}-err`} className="mt-2 text-sm text-red-400">
        {errors[name]}
      </p>
    ) : null;

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {status === 'sent' ? (
          <motion.div
            key="sent"
            role="status"
            initial={reduce ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="card flex min-h-[26rem] flex-col items-start justify-center p-8 md:p-12"
          >
            <span className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-paper text-ink" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h3 className="text-3xl font-semibold tracking-tight">Thank you — talk soon.</h3>
            <p className="mt-3 max-w-md text-muted">
              {endpoint
                ? 'Your message is with us. We reply to every enquiry personally, usually within one working day.'
                : 'Your email app should have opened with everything filled in. Just hit send and we’ll take it from there.'}
            </p>
            <button type="button" className="link-draw mt-8 text-sm text-paper" onClick={() => setStatus('idle')}>
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            noValidate
            onSubmit={onSubmit}
            initial={false}
            exit={reduce ? undefined : { opacity: 0, y: -10, transition: { duration: 0.3 } }}
            className="space-y-8"
            aria-describedby={`${id}-status`}
          >
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <label htmlFor={`${id}-name`} className="text-sm text-muted">
                  Your name
                </label>
                <input {...fieldProps('name')} type="text" autoComplete="name" className="field" placeholder="Jane Perera" />
                <Err name="name" />
              </div>
              <div>
                <label htmlFor={`${id}-email`} className="text-sm text-muted">
                  Email
                </label>
                <input
                  {...fieldProps('email')}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className="field"
                  placeholder="jane@yourbusiness.com"
                />
                <Err name="email" />
              </div>
            </div>

            <div>
              <label htmlFor={`${id}-business`} className="text-sm text-muted">
                Business name <span className="text-neutral-500">(optional)</span>
              </label>
              <input
                id={`${id}-business`}
                name="business"
                type="text"
                autoComplete="organization"
                className="field"
                placeholder="What are you building?"
              />
            </div>

            <fieldset>
              <legend className="text-sm text-muted">What can we help with?</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {services.map((s) => {
                  const on = picked.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(s)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
                        on
                          ? 'border-paper bg-paper text-ink'
                          : 'border-white/15 text-neutral-300 hover:border-white/40 hover:text-paper'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor={`${id}-details`} className="text-sm text-muted">
                Tell us about your project
              </label>
              <textarea
                {...fieldProps('details')}
                rows={4}
                className="field resize-none"
                placeholder="Where you are now, where you’d love to be, and any timelines."
              />
              <Err name="details" />
            </div>

            {/* Honeypot — hidden from people, tempting for bots */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Leave this empty
                <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send enquiry'}
                <span className="btn-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <p className="text-sm text-neutral-400">
                Prefer email?{' '}
                <a href={`mailto:${email}`} className="link-draw text-paper">
                  {email}
                </a>
              </p>
            </div>

            <p id={`${id}-status`} aria-live="polite" className="text-sm text-red-400">
              {status === 'error' && 'Something went wrong sending your message. Please try again, or email us directly.'}
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
