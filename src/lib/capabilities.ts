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
  email: !!process.env.RESEND_API_KEY,
  whatsapp: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  search: !!process.env.BRAVE_SEARCH_API_KEY,
  push: !!process.env.VAPID_PRIVATE_KEY,
};
