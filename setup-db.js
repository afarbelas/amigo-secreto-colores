import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

await db.execute(`
  CREATE TABLE IF NOT EXISTS colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    assigned_to INTEGER DEFAULT NULL
  )
`)

await db.execute(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    color_id INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (color_id) REFERENCES colors(id)
  )
`)

const colors = [
  'Rojo',
  'Azul',
  'Verde',
  'Amarillo',
  'Naranja',
  'Morado',
  'Rosado',
  'Café',
  'Negro',
  'Blanco',
  'Gris',
  'Celeste',
  'Fucsia',
  'Turquesa',
  'Lima',
  'Índigo',
  'Oliva',
  'Aguamarina',
  'Vinotinto',
  'Beige',
]

for (const color of colors) {
  await db.execute({
    sql: 'INSERT OR IGNORE INTO colors (name) VALUES (?)',
    args: [color],
  })
}

console.log('Base de datos Turso preparada correctamente.')