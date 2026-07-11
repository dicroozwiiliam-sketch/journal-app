const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

if (!code.includes('manualChunks')) {
    const replacement = `
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'motion/react', 'lucide-react', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/app-check']
        }
      }
    }
  }
});
`;
    code = code.replace(/export default defineConfig\(\{[\s\S]*?\}\);/, replacement.trim());
    fs.writeFileSync('vite.config.ts', code);
}
