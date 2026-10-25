import { Pool, types } from "pg";
import "dotenv/config";

// Un Pool réutilise des connexions au lieu d'en rouvrir une à chaque requête.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Par défaut, pg convertit les colonnes DATE (OID 1082) en objet Date JavaScript,
// ce qui donne "1990-01-15T00:00:00.000Z". On garde la chaîne brute "1990-01-15".
types.setTypeParser(1082, (value: string) => value);
