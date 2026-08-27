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

    const result = await db.execute({
      sql: `
        SELECT
          participants.id,
          participants.name,
          colors.name AS color
        FROM participants
        INNER JOIN colors
          ON colors.id = participants.color_id
        WHERE participants.name = ?
          AND participants.password_hash = ?
      `,
      args: [name, passwordHash],
    })

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Nombre o palabra clave incorrectos',
      })
    }

    return res.status(200).json(result.rows[0])
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'No fue posible realizar la consulta',
    })
  }
}