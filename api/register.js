import { createClient } from '@libsql/client'
import { createHash } from 'node:crypto'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

function hashPassword(password) {
  return createHash('sha256')
    .update(password, 'utf8')
    .digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método no permitido',
    })
  }

  try {
    const { name, password } = req.body

    if (!name || !password) {
      return res.status(400).json({
        error: 'Nombre y palabra clave son obligatorios',
      })
    }

    const passwordHash = hashPassword(password)

    const existing = await db.execute({
      sql: `
        SELECT id
        FROM participants
        WHERE name = ?
          AND password_hash = ?
      `,
      args: [name, passwordHash],
    })

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error:
          'Nombre no permitido. Por seguridad, elige otro e inténtalo nuevamente.',
      })
    }

    const available = await db.execute(`
      SELECT id, name
      FROM colors
      WHERE assigned_to IS NULL
    `)

    if (available.rows.length === 0) {
      return res.status(409).json({
        error: 'Ya no hay colores disponibles',
      })
    }

    const randomIndex = Math.floor(Math.random() * available.rows.length)
    const color = available.rows[randomIndex]

    const result = await db.execute({
      sql: `
        INSERT INTO participants (name, password_hash, color_id)
        VALUES (?, ?, ?)
      `,
      args: [name, passwordHash, color.id],
    })

    const participantId = Number(result.lastInsertRowid)

    await db.execute({
      sql: `
        UPDATE colors
        SET assigned_to = ?
        WHERE id = ?
      `,
      args: [participantId, color.id],
    })

    return res.status(201).json({
      id: participantId,
      name,
      color: color.name,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'No fue posible completar el registro',
    })
  }
}