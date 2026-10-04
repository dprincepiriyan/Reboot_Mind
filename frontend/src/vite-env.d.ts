/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute backend URL, e.g. http://192.168.1.10:8000 */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
