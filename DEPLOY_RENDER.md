# Deploy on Render (Static)

This project is configured for Render using `render.yaml`.

## Steps

1. Push this repo to GitHub.
2. In Render, click **New +** -> **Blueprint**.
3. Select this repository.
4. During setup, add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Deploy.

## Notes

- Build command uses `pnpm` via Corepack.
- Output path is `dist/pages`.
- SPA rewrite is configured (`/* -> /index.html`) so direct route opens work.
