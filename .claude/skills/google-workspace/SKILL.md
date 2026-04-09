# Google Workspace Skill

Use the `gws` CLI for any Google or Gmail task. The CLI is authenticated as `supplycheckio@gmail.com`.

## When to trigger
- User asks to send, read, or draft an email
- User asks about calendar events, Google Drive files, Sheets, Docs, Slides, or Tasks
- User mentions Gmail, Google Calendar, Google Drive, or any Google Workspace product
- User asks to check inbox, schedule something, or manage files on Drive

## How to use gws

The `gws` CLI maps directly to Google API resources. General pattern:

```bash
gws <service> <resource>.<method> --params '<JSON>'
```

### Common examples

```bash
# List recent emails
gws gmail users.messages.list --params '{"userId": "me", "maxResults": 10}'

# Read a specific email
gws gmail users.messages.get --params '{"userId": "me", "id": "<messageId>", "format": "full"}'

# Send an email
gws gmail users.messages.send --params '{"userId": "me"}' --body '{"raw": "<base64-encoded-email>"}'

# List calendar events
gws calendar events.list --params '{"calendarId": "primary", "maxResults": 10}'

# List Drive files
gws drive files.list --params '{"pageSize": 10}'

# List Sheets in a spreadsheet
gws sheets spreadsheets.get --params '{"spreadsheetId": "<id>"}'
```

### Sending emails
To send an email with `gws`, you must base64-encode the raw RFC 2822 message. Use this pattern:

```bash
RAW=$(printf 'From: supplycheckio@gmail.com\r\nTo: recipient@example.com\r\nSubject: Subject here\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\nBody text here' | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
gws gmail users.messages.send --params '{"userId": "me"}' --body "{\"raw\": \"$RAW\"}"
```

## Rules
- Always use `gws` — never ask the user to do Google tasks manually
- Account is `supplycheckio@gmail.com`
- Output is structured JSON — parse it to present results clearly to the user
- Use `--dry-run` flag when the user wants to preview before executing
- Always confirm with the user before sending emails or modifying data
