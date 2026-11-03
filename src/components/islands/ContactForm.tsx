/**
 * ContactForm — project enquiries delivered by email through Web3Forms.
 *
 *  • With JavaScript: validates inline, POSTs JSON to Web3Forms and shows an
 *    inline success state. Network failures and timeouts get a retry plus
 *    email and WhatsApp fallbacks, so an enquiry is never lost.
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

type Props = {
  accessKey: string;
  email: string;
  whatsappUrl: string;
  siteName: string;
  redirectUrl: string;
  services: readonly string[];
};
type Status = 'idle' | 'sending' | 'sent' | 'error';
type FieldName = 'name' | 'email' | 'message';
type Errors = Partial<Record<FieldName, string>>;

const ENDPOINT = 'https://api.web3forms.com/submit';
const TIMEOUT_MS = 15_000;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 3000;

const text = (data: FormData, key: string) => String(data.get(key) ?? '').trim();

function validate(data: FormData): Errors {
  const e: Errors = {};
  if (!text(data, 'name')) e.name = 'Please tell us your name.';
  const mail = text(data, 'email');
  if (!mail) e.email = 'We’ll need an email to reply.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) e.email = 'That email doesn’t look quite right.';
  if (text(data, 'message').length < MESSAGE_MIN) e.message = 'A sentence or two about your business helps us prepare.';
  return e;
}

/** Pill-styled native checkboxes: keyboard and screen-reader friendly, and they work without JS. */
function Choices({ name, legend, options }: { name: string; legend: string; options: readonly string[] }) {
  return (
    <fieldset>
      <legend className="label text-muted">
        {legend} <span className="font-normal tracking-normal normal-case">(optional)</span>
      </legend>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o}
            className="cursor-pointer rounded-full border border-[#bdbdbd] px-4 py-2 text-sm text-ink/80 transition-colors select-none hover:border-ink has-checked:border-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <input type="checkbox" name={name} value={o} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Err({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-2 text-sm text-red-700">
      {message}
    </p>
  ) : null;
}

export default function ContactForm({ accessKey, email, whatsappUrl, siteName, redirectUrl, services }: Props) {
  const id = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState('');
  const [fallbackHref, setFallbackHref] = useState(`mailto:${email}`);
  const [messageLength, setMessageLength] = useState(0);
  // Native validation stays on until hydration, so the no-JS form still checks required fields.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  // Move focus to the result panel once it mounts, so keyboard and screen-reader users land on it.
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
    const picked = data.getAll('services').map(String);
    const fields = {
      name,
      email: text(data, 'email'),
      services: picked.length ? picked.join(', ') : '—',
      message: text(data, 'message'),
    };

    // Pre-filled email in case the request fails, so the enquiry isn't lost.
    const summary = [`Name: ${fields.name}`, `Email: ${fields.email}`, `Services: ${fields.services}`, '', fields.message].join('\n');
    const subject = `New enquiry from ${name}`;
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

  if (status === 'sent') {
    return (
      <div ref={focusResult} tabIndex={-1} role="status" className="border border-line bg-card p-8 outline-none md:p-12">
        <p className="label text-muted">Message sent</p>
        <h2 className="mt-4 text-3xl font-light tracking-tight uppercase">Thank you — talk soon.</h2>
        <p className="mt-4 max-w-md leading-relaxed text-muted">
          Your message is with us. We reply to every enquiry personally, usually within one working day.
        </p>
        <button type="button" className="label link-draw mt-8 text-ink" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      action={ENDPOINT}
      method="POST"
      noValidate={hydrated}
      onSubmit={onSubmit}
      className="space-y-10"
      aria-describedby={`${id}-status`}
      aria-busy={status === 'sending'}
    >
      {/* Used only by the no-JavaScript fallback; the JS path sends these in the JSON body. */}
      <input type="hidden" name="access_key" value={accessKey} />
      <input type="hidden" name="subject" value={`New enquiry from the ${siteName} website`} />
      <input type="hidden" name="from_name" value={`${siteName} website`} />
      <input type="hidden" name="redirect" value={redirectUrl} />

      <div className="grid gap-10 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="label text-muted">
            Your name
          </label>
          <input {...fieldProps('name')} type="text" required maxLength={100} autoComplete="name" className="field" placeholder="Jane Perera" />
          <Err id={`${id}-name-err`} message={errors.name} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="label text-muted">
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

      <Choices name="services" legend="What can we help with?" options={services} />

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor={`${id}-message`} className="label text-muted">
            Tell us about your project
          </label>
          <span className="meta tabular-nums" aria-hidden="true">
            {messageLength}/{MESSAGE_MAX}
          </span>
        </div>
        <textarea
          {...fieldProps('message')}
          rows={5}
          required
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          className="field resize-y"
          placeholder="Where you are now, where you’d love to be, and any timelines or budget."
          onChange={(e) => setMessageLength(e.currentTarget.value.length)}
        />
        <Err id={`${id}-message-err`} message={errors.message} />
      </div>

      {/* Web3Forms honeypot — hidden from people, tempting for bots */}
      <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send enquiry'}
          <span className="btn-arrow" aria-hidden="true">
            →
          </span>
        </button>
        <p className="text-sm text-muted">
          Prefer to chat?{' '}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="link-draw text-ink">
            WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
          </a>{' '}
          or{' '}
          <a href={`mailto:${email}`} className="link-draw text-ink">
            email
          </a>
        </p>
      </div>

      <div id={`${id}-status`} aria-live="polite" className="text-sm">
        {status === 'sending' && <span className="sr-only">Sending your message…</span>}
        {status === 'error' && (
          <p className="text-red-700">
            {serverError} Your message hasn’t been sent. Please try again,{' '}
            <a href={fallbackHref} className="link-draw text-ink">
              send it by email
            </a>
            , or{' '}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="link-draw text-ink">
              message us on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        )}
      </div>
    </form>
  );
}
