import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Load env variables from all possible sources
  // process.cwd() might be missing in some type definitions, so we cast to any
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // 2. Detect API Key with priority
  const apiKey = env.API_KEY || env.VITE_API_KEY || env.REACT_APP_API_KEY || '';

  console.log("Build Mode:", mode);
  console.log("API Key detected:", apiKey ? "Yes (Hidden)" : "No");

  return {
    plugins: [react()],
    define: {
      // 3. Inject the key as process.env.API_KEY to match Google GenAI SDK guidelines
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    server: {
      port: 3000
    }
  };
});