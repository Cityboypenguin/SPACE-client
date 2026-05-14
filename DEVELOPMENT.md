# Development Setup

## Environment Configuration

### Local Development (Default)

By default, the app connects to `http://localhost:8080`:

```bash
npm run dev
```

This works when both the frontend and backend are on the same machine.

### Cross-Device Testing

To test on a different device (phone, tablet, or another computer) on the same network:

1. **Find your machine's IP address or hostname:**
   ```bash
   # macOS/Linux
   ifconfig | grep inet
   
   # Or use your machine's hostname
   hostname
   # Usually: your-machine-name.local
   ```

2. **Create `.env.development.local` (gitignored):**
   ```bash
   # Replace with your actual IP or hostname
   VITE_API_URL=http://192.168.1.100:8080/query
   # OR
   VITE_API_URL=http://your-machine-name.local:8080/query
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```

4. **From another device, access:**
   - If using IP: `http://192.168.1.100:5173`
   - If using hostname: `http://your-machine-name.local:5173`

> ⚠️ Make sure your backend server is listening on `0.0.0.0:8080`, not just `localhost:8080`

### Notes

- `.env.development.local` is gitignored, so you can safely commit without leaking your local setup
- Changes to `.env.development.local` require dev server restart
