# PageSmith AI API

Small Railway-ready backend for PageSmith's AI Polish feature. It keeps the Claude API key off the static site and exposes:

- `GET /health`
- `POST /api/polish`

## Railway Variables

Set these on the Railway service:

- `ANTHROPIC_API_KEY`: your Claude/Anthropic API key.
- `ANTHROPIC_MODEL`: optional, defaults to `claude-sonnet-4-6`.
- `ALLOWED_ORIGINS`: recommended `https://tactag.app,http://localhost:3000`.

## Deploy Notes

Deploy this folder as the Railway service root directory:

```sh
pagesmith-api
```

After Railway gives you a public service URL, open PageSmith, click `AI Polish`, paste the service URL, and save it. PageSmith stores only the service URL in browser local storage, never the API key.
