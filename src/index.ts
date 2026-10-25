import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { pool } from "./db";

const app = express();
app.use(express.json()); // lit le corps JSON des requêtes (comme @RequestBody)

// Schéma de validation de l'entrée (équivalent de Bean Validation en Spring)
const patientSchema = z.object({
  nom: z.string({ required_error: "nom obligatoire" }).trim().min(1, "nom obligatoire").max(100),
  prenom: z.string({ required_error: "prenom obligatoire" }).trim().min(1, "prenom obligatoire").max(100),
  date_naissance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "format attendu : AAAA-MM-JJ")
    .optional(),
});

// Santé de l'API : utile pour vérifier que le serveur ET la base répondent
app.get("/health", async (_req: Request, res: Response) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});

// GET : liste paginée des patients  ->  /patients?page=1&size=10
app.get("/patients", async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const size = Math.min(Math.max(Number(req.query.size) || 10, 1), 100); // taille max = 100
  const offset = (page - 1) * size;

  // Requête PARAMÉTRÉE ($1, $2) : protège contre l'injection SQL
  const result = await pool.query(
    "SELECT id, nom, prenom, date_naissance, created_at FROM patients ORDER BY id LIMIT $1 OFFSET $2",
    [size, offset]
  );
  res.json({ page, size, data: result.rows });
});

// GET : un patient par id  ->  /patients/1
app.get("/patients/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "id invalide" });
    return;
  }
  const result = await pool.query(
    "SELECT id, nom, prenom, date_naissance, created_at FROM patients WHERE id = $1",
    [id]
  );
  if (result.rowCount === 0) {
    res.status(404).json({ error: "patient introuvable" });
    return;
  }
  res.json(result.rows[0]);
});

// POST : créer un patient  ->  201 Created
app.post("/patients", async (req: Request, res: Response) => {
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "données invalides",
      details: parsed.error.issues.map((i) => ({ champ: i.path.join("."), message: i.message })),
    });
    return;
  }
  const { nom, prenom, date_naissance } = parsed.data;

  const result = await pool.query(
    `INSERT INTO patients (nom, prenom, date_naissance)
     VALUES ($1, $2, $3)
     RETURNING id, nom, prenom, date_naissance, created_at`, // RETURNING : spécifique PostgreSQL
    [nom, prenom, date_naissance ?? null]
  );
  res.status(201).json(result.rows[0]);
});

// PUT : remplacer un patient  ->  /patients/1
// PUT = remplacement COMPLET : tous les champs sont réécrits (date_naissance absente => NULL).
app.put("/patients/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "id invalide" });
    return;
  }
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "données invalides",
      details: parsed.error.issues.map((i) => ({ champ: i.path.join("."), message: i.message })),
    });
    return;
  }
  const { nom, prenom, date_naissance } = parsed.data;

  const result = await pool.query(
    `UPDATE patients
     SET nom = $1, prenom = $2, date_naissance = $3
     WHERE id = $4
     RETURNING id, nom, prenom, date_naissance, created_at`,
    [nom, prenom, date_naissance ?? null, id]
  );
  if (result.rowCount === 0) {
    res.status(404).json({ error: "patient introuvable" });
    return;
  }
  res.json(result.rows[0]);
});

// DELETE : supprimer un patient  ->  204 No Content (succès sans corps)
app.delete("/patients/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "id invalide" });
    return;
  }
  const result = await pool.query("DELETE FROM patients WHERE id = $1", [id]);
  if (result.rowCount === 0) {
    res.status(404).json({ error: "patient introuvable" });
    return;
  }
  res.status(204).send();
});

// Gestion d'erreurs centralisée (équivalent de @RestControllerAdvice)
// Express 5 transmet automatiquement à ce handler les erreurs des routes async.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err); // en vrai projet : logger sans données sensibles
  res.status(500).json({ error: "erreur interne du serveur" });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API démarrée sur http://localhost:${port}`));