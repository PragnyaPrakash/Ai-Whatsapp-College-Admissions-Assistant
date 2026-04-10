# WhatsApp College Bridge Bot

This project is a WhatsApp bot for students who want help choosing graduation colleges. It collects a student's profile through chat, stores colleges and students in SQLite, suggests colleges with key admissions information, and can use OpenAI to answer follow-up questions in natural language.

## What it does

- Collects student details such as age, date of birth, preferred stream, location preference, budget, and future plans.
- Recommends colleges from a sample dataset.
- Stores colleges, student profiles, and inquiry history in SQLite.
- Shares application details, deadlines, fees, and college highlights.
- Uses OpenAI for free-form follow-up questions after the profile is collected.
- Supports OpenAI or Gemini through an environment-variable provider switch.
- Supports a `RESET` command to restart the conversation.

## Suggested product flow

1. Student sends `hi` on WhatsApp.
2. Bot collects profile data step by step.
3. Bot recommends top colleges based on stream, budget, location, and goals.
4. Student asks for more details using `DETAILS 1`, `DETAILS 2`, or `DETAILS 3`.
5. Students can ask free-form questions like "Which one is better for placements?" or "Show affordable options in Tamil Nadu."

## Tech stack

- Node.js
- Express
- Twilio WhatsApp Sandbox
- OpenAI Responses API
- Gemini API
- SQLite

## Project structure

```text
src/
  data/colleges.js
  db/
  repositories/
  services/botFlow.js
  services/recommendationEngine.js
  services/sessionStore.js
  server.js
  aiAdvisor.js
test/
  run-tests.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Seed the database:

```bash
npm run db:seed
```

4. Update `.env` with your Twilio credentials and your chosen LLM provider settings.

Example with OpenAI:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
```

Example with Gemini:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

5. Start the server:

```bash
npm run dev
```

6. Expose your local server with a tunnel such as `ngrok`:

```bash
ngrok http 3000
```

7. In Twilio Console, open the WhatsApp Sandbox and set the incoming webhook to:

```text
https://your-ngrok-url/whatsapp
```

8. Join the sandbox by sending the provided `join <code>` message from your phone to Twilio's sandbox WhatsApp number.

## Admin API

You can manage stored colleges with these local endpoints:

- `GET /api/colleges`
- `POST /api/colleges`
- `PUT /api/colleges/:id`
- `DELETE /api/colleges/:id`
- `GET /api/students/:phoneNumber`

## Admin dashboard

You now also have a browser-based admin dashboard at:

```text
http://localhost:3000/admin
```

Use it to:

- View all stored colleges
- Search by name, location, stream, or highlight
- Create new college entries
- Edit existing entries
- Deactivate colleges so students no longer see them in recommendations

Example create request:

```bash
curl -X POST http://localhost:3000/api/colleges \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"new-college\",\"name\":\"Example College\",\"location\":\"Hyderabad, Telangana\",\"streams\":[\"business\"],\"feesInrPerYear\":120000,\"applicationDeadline\":\"2026-06-01\",\"applicationMode\":\"Online application\",\"eligibility\":\"Class 12 completion\",\"website\":\"https://example.edu\",\"highlights\":[\"Scholarships available\",\"City campus\"]}"
```

## Twilio integration notes

Twilio's current WhatsApp quickstart still supports using the WhatsApp Sandbox for development, which is the easiest way to prototype without waiting for sender verification:

- [Twilio WhatsApp Node quickstart](https://www.twilio.com/docs/whatsapp/quickstart/node)

## LLM integration notes

OpenAI path:

- [Responses API migration guide](https://platform.openai.com/docs/guides/migrate-to-responses)
- [Text generation guide](https://platform.openai.com/docs/guides/chat-completions)
- [Responses API reference](https://platform.openai.com/docs/api-reference/responses/create?api-mode=responses)
- [Models overview](https://platform.openai.com/docs/models)

The default model in this starter is `gpt-5-mini`, which OpenAI documents as a faster, cost-efficient GPT-5 variant for well-defined tasks:

- [GPT-5 mini model page](https://platform.openai.com/docs/models/gpt-5-mini)

Gemini path:

- [Gemini text generation guide](https://ai.google.dev/gemini-api/docs/text-generation)
- [Gemini models overview](https://ai.google.dev/models/gemini)
- [Gemini models API](https://ai.google.dev/api/models)

This starter uses Google's official JavaScript SDK and defaults Gemini to `gemini-2.5-flash`, based on the current text generation examples in Google AI for Developers docs.

## Important limitations

The included starter still seeds a small sample set of colleges into SQLite. The LLM is instructed to answer only from the stored database records and the student's profile, so it will not magically know live admission changes. For production, the next step is to sync this database from trusted college partners, internal CRM exports, or verified admissions feeds.

## Good next upgrades

- Add OpenAI for natural-language question answering.
- Store students and chat history in PostgreSQL or MongoDB.
- Add an admin dashboard for college data updates.
- Add lead routing so colleges can follow up with matched students.
- Add multilingual support for English, Hindi, and regional languages.
