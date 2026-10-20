/**
 * ContactForm — project enquiries delivered by email through Web3Forms.
 *
 *  • With JavaScript: validates inline, POSTs JSON to Web3Forms and shows an
 *    inline success state. Network failures and timeouts get a retry and a
 *    pre-filled email fallback, so an enquiry is never lost.
 *  • Without JavaScript: the same markup is a plain HTML form that posts to
 *    Web3Forms, which redirects back to /thanks/.
 *
 * The access key is public by design (Web3Forms routes mail to the inbox the
 * key was created for). Spam is filtered with Web3Forms' `botcheck` honeypot.
 *
 * Accessible: native labels and fieldsets, inline errors linked with
 * aria-describedby, status announced via aria-live, focus moved to the first
 * invalid field and to the result panel after sending.
 */
import { useCallback, useEffect, useId, useState, type SubmitEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Props = {
  accessKey: string;
  email: string;
  siteName: string;
  redirectUrl: string;
  services: readonly string[];
  budgets: readonly string[];
  timelines: readonly string[];
};
type Status = 'idle' | 'sending' | 'sent' | 'error';
type FieldName = 'name' | 'email' | 'phone' | 'message';
type Errors = Partial<Record<FieldName, string>>;

const ENDPOINT = 'https://api.web3forms.com/submit';
const TIMEOUT_MS = 15_000;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 3000;
const EASE = [0.16, 1, 0.3, 1] as const;

const text = (data: FormData, key: string) => String(data.get(key) ?? '').trim();

function validate(data: FormData): Errors {
  const e: Errors = {};
  if (!text(data, 'name')) e.name = 'Please tell us your name.';
  const mail = text(data, 'email');
  if (!mail) e.email = 'We’ll need an email to reply.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) e.email = 'That email doesn’t look quite right.';
  const phone = text(data, 'phone');
  if (phone && !/^\+?[\d\s()./-]{7,20}$/.test(phone)) e.phone = 'Please use digits, spaces and an optional leading +.';
  const message = text(data, 'message');
  if (message.length < MESSAGE_MIN) e.message = 'A sentence or two about your business helps us prepare.';
  return e;
}

const PILL =
  'cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-300 transition-colors duration-300 select-none hover:border-white/40 hover:text-paper has-checked:border-paper has-checked:bg-paper has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent';

/** Pill-styled native checkboxes/radios: keyboard and screen-reader friendly, and they work without JS. */
function Choices({ name, legend, options, multiple }: { name: string; legend: string; options: readonly string[]; multiple?: boolean }) {
  return (
    <fieldset>
      <legend className="text-sm text-muted">
        {legend} <span className="text-neutral-500">(optional)</span>
      </legend>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className={PILL}>
            <input type={multiple ? 'checkbox' : 'radio'} name={name} value={o} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Err({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-2 text-sm text-red-400">
      {message}
    </p>
  ) : null;
}

export default function ContactForm({ accessKey, email, siteName, redirectUrl, services, budgets, timelines }: Props) {
  const id = useId();
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState('');
  const [fallbackHref, setFallbackHref] = useState(`mailto:${email}`);
  const [messageLength, setMessageLength] = useState(0);
  // Native validation stays on until hydration, so the no-JS form still checks required fields.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  // Move focus to the result panel once it mounts (after the form's exit animation),
  // so keyboard and screen-reader users land on it.
  const focusResult = useCallback((el: HTMLDivElement | null) => el?.focus(), []);

  async function onSubmit(ev: SubmitEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (status === 'sending') return;
    const form = ev.currentTarget;
    const data = new FormData(form);

    const found = validate(data);
    setErrors(found);
    setServerError('');
    const first = (Object.keys(found) as FieldName[])[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const name = text(data, 'name');
    const business = text(data, 'business');
    const picked = data.getAll('services').map(String);
    const fields = {
      name,
      email: text(data, 'email'),
      phone: text(data, 'phone') || '—',
      business: business || '—',
      services: picked.length ? picked.join(', ') : '—',
      budget: text(data, 'budget') || '—',
      timeline: text(data, 'timeline') || '—',
      message: text(data, 'message'),
    };

    // Pre-filled email in case the request fails, so the enquiry isn't lost.
    const summary = [
      `Name: ${fields.name}`,
      `Email: ${fields.email}`,
      `Phone: ${fields.phone}`,
      `Business: ${fields.business}`,
      `Services: ${fields.services}`,
      `Budget: ${fields.budget}`,
      `Timeline: ${fields.timeline}`,
      '',
      fields.message,
    ].join('\n');
    const subject = `New enquiry from ${name}${business ? ` — ${business}` : ''}`;
    setFallbackHref(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      setStatus('sending');
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject,
          from_name: `${siteName} website`,
          botcheck: data.get('botcheck') === 'on',
          ...fields,
        }),
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
      if (!res.ok || !json?.success) throw new Error(json?.message || `Request failed (${res.status})`);
      setStatus('sent');
      form.reset();
      setMessageLength(0);
    } catch (err) {
      setServerError(
        err instanceof DOMException && err.name === 'AbortError'
          ? 'The request timed out.'
          : err instanceof Error && !/fetch|network/i.test(err.message)
            ? err.message
            : 'We couldn’t reach the server.',
      );
      setStatus('error');
    } finally {
      window.clearTimeout(timer);
    }
  }

  const fieldProps = (name: FieldName) => ({
    id: `${id}-${name}`,
    name,
    'aria-invalid': errors[name] ? (true as const) : undefined,
    'aria-describedby': errors[name] ? `${id}-${name}-err` : undefined,
    onInput: () => errors[name] && setErrors((e) => ({ ...e, [name]: undefined })),
  });

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {status === 'sent' ? (
          <motion.div
            key="sent"
            ref={focusResult}
            tabIndex={-1}
            role="status"
            initial={reduce ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="card flex min-h-[26rem] flex-col items-start justify-center p-8 outline-none md:p-12"
          >
            <span className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-paper text-ink" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h3 className="text-3xl font-semibold tracking-tight">Thank you — talk soon.</h3>
            <p className="mt-3 max-w-md text-muted">
              Your message is with us. We reply to every enquiry personally, usually within one working day.
            </p>
            <button type="button" className="link-draw mt-8 text-sm text-paper" onClick={() => setStatus('idle')}>
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            action={ENDPOINT}
            method="POST"
            noValidate={hydrated}
            onSubmit={onSubmit}
            initial={false}
            exit={reduce ? undefined : { opacity: 0, y: -10, transition: { duration: 0.3 } }}
            className="space-y-8"
            aria-describedby={`${id}-status`}
            aria-busy={status === 'sending'}
          >
            {/* Used only by the no-JavaScript fallback; the JS path sends these in the JSON body. */}
            <input type="hidden" name="access_key" value={accessKey} />
            <input type="hidden" name="subject" value={`New enquiry from the ${siteName} website`} />
            <input type="hidden" name="from_name" value={`${siteName} website`} />
            <input type="hidden" name="redirect" value={redirectUrl} />

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <label htmlFor={`${id}-name`} className="text-sm text-muted">
                  Your name
                </label>
                <input
                  {...fieldProps('name')}
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  className="field"
                  placeholder="Jane Perera"
                />
                <Err id={`${id}-name-err`} message={errors.name} />
              </div>
              <div>
                <label htmlFor={`${id}-email`} className="text-sm text-muted">
                  Email
                </label>
                <input
                  {...fieldProps('email')}
                  type="email"
                  required
                  maxLength={150}
                  autoComplete="email"
                  inputMode="email"
                  className="field"
                  placeholder="jane@yourbusiness.com"
                />
                <Err id={`${id}-email-err`} message={errors.email} />
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <label htmlFor={`${id}-phone`} className="text-sm text-muted">
                  Phone / WhatsApp <span className="text-neutral-500">(optional)</span>
                </label>
                <input
                  {...fieldProps('phone')}
                  type="tel"
                  maxLength={20}
                  autoComplete="tel"
                  inputMode="tel"
                  className="field"
                  placeholder="+94 77 123 4567"
                />
                <Err id={`${id}-phone-err`} message={errors.phone} />
              </div>
              <div>
                <label htmlFor={`${id}-business`} className="text-sm text-muted">
                  Business name <span className="text-neutral-500">(optional)</span>
                </label>
                <input
                  id={`${id}-business`}
                  name="business"
                  type="text"
                  maxLength={120}
                  autoComplete="organization"
                  className="field"
                  placeholder="What are you building?"
                />
              </div>
            </div>

            <Choices name="services" legend="What can we help with?" options={services} multiple />
            <Choices name="budget" legend="Rough budget" options={budgets} />
            <Choices name="timeline" legend="When would you like to start?" options={timelines} />

            <div>
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor={`${id}-message`} className="text-sm text-muted">
                  Tell us about your project
                </label>
                <span className="text-xs text-neutral-500 tabular-nums" aria-hidden="true">
                  {messageLength}/{MESSAGE_MAX}
                </span>
              </div>
              <textarea
                {...fieldProps('message')}
                rows={4}
                required
                minLength={MESSAGE_MIN}
                maxLength={MESSAGE_MAX}
                className="field resize-y"
                placeholder="Where you are now, where you’d love to be, and any timelines."
                onChange={(e) => setMessageLength(e.currentTarget.value.length)}
              />
              <Err id={`${id}-message-err`} message={errors.message} />
            </div>

            {/* Web3Forms honeypot — hidden from people, tempting for bots */}
            <input
              type="checkbox"
              name="botcheck"
              className="hidden"
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

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

            <div id={`${id}-status`} aria-live="polite" className="text-sm">
              {status === 'sending' && <span className="sr-only">Sending your message…</span>}
              {status === 'error' && (
                <p className="text-red-400">
                  {serverError} Your message hasn’t been sent. Please try again, or{' '}
                  <a href={fallbackHref} className="link-draw text-paper">
                    send it by email instead
                  </a>
                  .
                </p>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
