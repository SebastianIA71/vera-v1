export const capabilities = {
  ai: {
    primary: !!process.env.ANTHROPIC_API_KEY,
    fallback: !!process.env.OPENAI_API_KEY,
    get available() { return this.primary || this.fallback; },
  },
  voice: {
    clientSide: true,
    serverSide: !!process.env.OPENAI_API_KEY,
  },
  email:  !!process.env.RESEND_API_KEY,
  search: !!process.env.BRAVE_SEARCH_API_KEY,
  push:     !!process.env.VAPID_PRIVATE_KEY,
  serpapi:  !!process.env.SERPAPI_KEY,
};
