/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_FORM_URL?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
