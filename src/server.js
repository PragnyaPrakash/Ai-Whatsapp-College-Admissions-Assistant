require("dotenv").config();

const path = require("node:path");
const express = require("express");
const { handleIncomingMessage } = require("./services/botFlow");
const { runMigrations } = require("./db/migrate");
const { ensureSeedData } = require("./db/seed");
const { getAllColleges, upsertCollege, deactivateCollege } = require("./repositories/collegeRepository");
const { getStudentProfile } = require("./repositories/studentRepository");

const app = express();
const port = Number(process.env.PORT || 3000);

runMigrations();
const seedResult = ensureSeedData();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/admin", express.static(path.join(process.cwd(), "public", "admin")));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "whatsapp-college-bridge-bot"
  });
});

app.get("/", (_req, res) => {
  res.redirect("/admin");
});

app.get("/api/colleges", (_req, res) => {
  res.json({
    colleges: getAllColleges({ includeInactive: true })
  });
});

app.post("/api/colleges", (req, res) => {
  const college = upsertCollege(req.body);
  res.status(201).json({ college });
});

app.put("/api/colleges/:id", (req, res) => {
  const college = upsertCollege({
    ...req.body,
    id: req.params.id
  });
  res.json({ college });
});

app.delete("/api/colleges/:id", (req, res) => {
  deactivateCollege(req.params.id);
  res.status(204).send();
});

app.get("/api/students/:phoneNumber", (req, res) => {
  const student = getStudentProfile(req.params.phoneNumber);

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json({ student });
});

app.post("/whatsapp", async (req, res) => {
  const from = req.body.From || req.body.from || "unknown";
  const body = req.body.Body || req.body.body || "";

  try {
    const twiml = await handleIncomingMessage(from, body);
    res.type("text/xml").send(twiml);
  } catch (error) {
    console.error("WhatsApp webhook error", error);
    res
      .type("text/xml")
      .send(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>I hit an internal error while processing your message. Please try again.</Message></Response>'
      );
  }
});

app.listen(port, () => {
  if (seedResult.seeded) {
    console.log(`Seeded ${seedResult.count} starter colleges into the database.`);
  }
  console.log(`Server running on http://localhost:${port}`);
});
