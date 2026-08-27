import http from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'

const PORT = 3001

const db = new DatabaseSync('./data/amigo-secreto.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    assigned_to INTEGER DEFAULT NULL
  )
`)

db.exec(`
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

const insertColor = db.prepare(
  'INSERT OR IGNORE INTO colors (name) VALUES (?)'
)

for (const color of colors) {
  insertColor.run(color)
}

function getRandomAvailableColor() {
  const availableColors = db
    .prepare(`
      SELECT id, name
      FROM colors
      WHERE assigned_to IS NULL
    `)
    .all()

  if (availableColors.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * availableColors.length)

  return availableColors[randomIndex]
}

function hashPassword(password) {
  return createHash('sha256')
    .update(password, 'utf8')
    .digest('hex')
}

function registerParticipant(name, passwordHash) {
  const color = getRandomAvailableColor()

  if (!color) {
    return null
  }

  db.exec('BEGIN TRANSACTION')

  try {
    const participantResult = db
      .prepare(`
        INSERT INTO participants (name, password_hash, color_id)
        VALUES (?, ?, ?)
      `)
      .run(name, passwordHash, color.id)

    db.prepare(`
      UPDATE colors
      SET assigned_to = ?
      WHERE id = ?
    `).run(participantResult.lastInsertRowid, color.id)

    db.exec('COMMIT')

    return {
      id: Number(participantResult.lastInsertRowid),
      name,
      color: color.name,
    }
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function findParticipant(name, passwordHash) {
  return db
    .prepare(`
      SELECT
        participants.id,
        participants.name,
        colors.name AS color
      FROM participants
      INNER JOIN colors
        ON colors.id = participants.color_id
      WHERE participants.name = ?
        AND participants.password_hash = ?
    `)
    .get(name, passwordHash)
}

function participantExists(name, passwordHash) {
  return db
    .prepare(`
      SELECT id
      FROM participants
      WHERE name = ?
        AND password_hash = ?
    `)
    .get(name, passwordHash)
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
    }


    if (req.method === 'POST' && req.url === '/api/register') {
        try {
            let body = ''

            for await (const chunk of req) {
            body += chunk
            }

            const { name, password } = JSON.parse(body)

            if (!name || !password) {
            res.writeHead(400)
            res.end(
                JSON.stringify({
                error: 'Nombre y palabra clave son obligatorios',
                })
            )
            return
            }

            const passwordHash = hashPassword(password)

            if (participantExists(name, passwordHash)) {
            res.writeHead(409)
            res.end(
                JSON.stringify({
                error: 'Nombre no permitido. Por seguridad, elige otra e inténtalo nuevamente.',
                })
            )
            return
            }

            const participant = registerParticipant(name, passwordHash)

            if (!participant) {
            res.writeHead(409)
            res.end(
                JSON.stringify({
                error: 'Ya no hay colores disponibles',
                })
            )
            return
            }

            res.writeHead(201)
            res.end(JSON.stringify(participant))
        } catch (error) {
            console.error(error)

            res.writeHead(400)
            res.end(
            JSON.stringify({
                error: 'Solicitud inválida',
            })
            )
        }

        return
    }

    if (req.method === 'POST' && req.url === '/api/consultar') {
        try {
            let body = ''

            for await (const chunk of req) {
            body += chunk
            }

            const { name, password } = JSON.parse(body)

            if (!name || !password) {
            res.writeHead(400)
            res.end(
                JSON.stringify({
                error: 'Nombre y palabra clave son obligatorios',
                })
            )
            return
            }

            const passwordHash = hashPassword(password)
            const participant = findParticipant(name, passwordHash)

            if (!participant) {
            res.writeHead(401)
            res.end(
                JSON.stringify({
                error: 'Nombre o palabra clave incorrectos',
                })
            )
            return
            }

            res.writeHead(200)
            res.end(JSON.stringify(participant))
        } catch (error) {
            console.error(error)

            res.writeHead(400)
            res.end(
            JSON.stringify({
                error: 'Solicitud inválida',
            })
            )
        }

        return
    }

    res.writeHead(200)

    res.end(
        JSON.stringify({
        mensaje: 'Servidor de Amigo Secreto por Colores funcionando',
        })
    )
})

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`)
})