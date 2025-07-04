# AI-assisted Coffee Import – Setup Guide

These instructions cover the keys & deployment steps needed for the **OCR → Gemini** flow.

---
## 1 · Mobile app configuration

1. `app.json` already contains:
   ```json
   "extra": {
     "BACKEND_URL": "https://YOUR_PROJECT.functions.supabase.co"
   }
   ```
2. Change `YOUR_PROJECT` to **your Supabase project ref** (find it in your dashboard → Settings → General).  
3. Re-build or run `expo start -c` so the extra constant is picked up by the JS bundle.

> Access in code via `import Constants from 'expo-constants';`
> ```js
> const BACKEND_URL = Constants.expoConfig.extra.BACKEND_URL;
> ```

---
## 2 · Required API keys (backend)

| Key                 | Where to get it | Purpose |
|---------------------|-----------------|---------|
| `GEMINI_API_KEY`    | https://ai.google.dev/ | Calls Gemini-Pro to structure the OCR'd text. |
| `SERPAPI_KEY`       | https://serpapi.com/   | Google Search JSON API – finds product URLs. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud Console → Service Accounts → *Create key* (JSON) | Used by `@google-cloud/vision` for OCR. Save the JSON file and set this env var to its **contents**, not the path, when using Supabase secrets. |

### Setting secrets

```bash
supabase secrets set \
  GEMINI_API_KEY=sk-… \
  SERPAPI_KEY=… \
  GOOGLE_APPLICATION_CREDENTIALS='{"type":"service_account",…}'
```

---
## 3 · Deploy the Edge Function

1. Install CLI (once):
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
2. Run locally for tests:
   ```bash
   cd supabase
   supabase functions serve parse-coffee --no-verify-jwt
   ```
3. Deploy:
   ```bash
   supabase functions deploy parse-coffee --project-ref YOUR_PROJECT_REF
   ```
4. The public URL will be:
   ```
   https://YOUR_PROJECT_REF.functions.supabase.co/parse-coffee
   ```
   Make sure this matches `BACKEND_URL` in `app.json` (without the `/parse-coffee` path – we append that in the code).

---
## 4 · Quota & cost tips

* **Vision OCR** gives 1000 units/month free. Each bag scan ≈ 1 unit.  
* **Gemini Pro** is free in developer preview.  
* **SerpAPI** has 100 searches/month on the free tier – caching recommended.

Happy brewing ☕️