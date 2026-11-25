// Production build of one consumer entry, chosen by FIXTURE_ENTRY (see run.sh).
const entry = process.env.FIXTURE_ENTRY;
if (!entry) throw new Error("vite.config.mjs: FIXTURE_ENTRY is not set");

export default {
  logLevel: "warn",
  build: {
    outDir: "out",
    emptyOutDir: true,
    rollupOptions: { input: entry },
  },
};
