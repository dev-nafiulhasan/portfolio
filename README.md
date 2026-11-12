# Portfolio

Next.js portfolio with a built-in admin panel. Edit all text, add or remove projects,
and upload images from `/admin`. No code changes needed for content.

## Run on your computer

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin (local password: `admin`)

Locally, changes are saved to `data/content.json` and images to `public/uploads`.

## Put it on Vercel (free Hobby plan)

1. Push this folder to a GitHub repository.
2. On vercel.com choose **Add New → Project** and import the repository. Deploy.
3. In the project open **Storage → Create Database → Blob**, and connect it to the project.
   This adds `BLOB_READ_WRITE_TOKEN` automatically. It stores your content and images.
4. In **Settings → Environment Variables** add `ADMIN_PASSWORD` with a strong password.
5. **Deployments → Redeploy** so both settings take effect.
6. Open `your-site.vercel.app/admin`, sign in, edit, press **Save changes**.

Saved changes appear on the live site straight away. No redeploy needed.

## Where things are

| What | Where |
| --- | --- |
| Starter content (used until first save) | `lib/default-content.ts` |
| Site design (colours, type, layout) | `app/globals.css` |
| Home page sections | `app/page.tsx` |
| Case study page | `app/work/[slug]/page.tsx` |
| Admin panel | `app/admin/page.tsx` |
| Storage (Vercel Blob / local files) | `lib/store.ts` |
| Sign-in | `lib/auth.ts` |

## Notes

- Images are resized to WebP in the browser before upload (max 4 MB after resizing).
- The accent colour is set in Admin → General.
- Vercel's free Blob allowance is limited; check your usage under Storage if you upload a lot.
