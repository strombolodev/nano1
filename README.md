# Magnific Nano Banana Proxy

Deploy ke Netlify baru, lalu endpoint proxy akan aktif di:

- `GET https://DOMAIN/.netlify/functions/proxy/`
- `POST https://DOMAIN/.netlify/functions/proxy/generate-image`
- `GET https://DOMAIN/.netlify/functions/proxy/status-image/:taskId`
- `GET https://DOMAIN/.netlify/functions/proxy/tasks-image`
- `GET https://DOMAIN/.netlify/functions/proxy/validate`

Header dari backend:

```http
x-proxy-api-key: MAGNIFIC_API_KEY
Content-Type: application/json
```

Body create:

```json
{
  "prompt": "...",
  "aspect_ratio": "1:1",
  "resolution": "1K",
  "use_google_search_tool": true,
  "reference_images": []
}
```

Setelah deploy, tambahkan URL function ke `apps/gen-magni/proxies.json`:

```json
{
  "proxies": [
    "https://DOMAIN.netlify.app/.netlify/functions/proxy"
  ]
}
```
