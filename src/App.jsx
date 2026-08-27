import { useState } from 'react'
import './App.css'

const colorStyles = {
  Rojo: '#ef4444',
  Azul: '#3b82f6',
  Verde: '#22c55e',
  Amarillo: '#facc15',
  Naranja: '#f97316',
  Morado: '#8b5cf6',
  Rosado: '#ec4899',
  Café: '#92400e',
  Negro: '#18181b',
  Blanco: '#ffffff',
  Gris: '#6b7280',
  Celeste: '#38bdf8',
  Fucsia: '#d946ef',
  Turquesa: '#14b8a6',
  Lima: '#84cc16',
  Índigo: '#6366f1',
  Oliva: '#84a11b',
  Aguamarina: '#2dd4bf',
  Vinotinto: '#991b1b',
  Beige: '#d6c3a5',
}

function App() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('register')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const endpoint =
      mode === 'register'
        ? 'http://localhost:3001/api/register'
        : 'http://localhost:3001/api/consultar'

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'No fue posible completar la operación.')
        return
      }

      setResult(data)
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
  }

  function handleBack() {
    setResult(null)
    setError('')
  }

  if (result) {
    const color = colorStyles[result.color] || '#7657d9'

    return (
      <main
        className="app result-screen"
        style={{
          '--result-color': color,
        }}
      >
        <div className="result-glow" />

        <section className="reveal-card">
          <div className="reveal-stars">
            <span>✦</span>
            <span>✦</span>
            <span>✦</span>
          </div>

          <p className="reveal-small">¡Listo, {result.name}!</p>

          <h1>
            Tu color
            <strong>es...</strong>
          </h1>

          <div
            className="color-orb"
            style={{
              backgroundColor: color,
            }}
          >
            <div className="orb-face">
              <span />
              <span />
              <i />
            </div>
          </div>

          <div className="color-name">
            {result.color}
          </div>

          <p className="secret-message">
            Este es tu color secreto.
            <br />
            No se lo muestres a nadie.
          </p>

          <button
            type="button"
            className="back-button"
            onClick={handleBack}
          >
            ← Volver
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <div className="background-shape shape-one" />
      <div className="background-shape shape-two" />
      <div className="background-shape shape-three" />

      <section className="card">
        <div className="confetti confetti-one">✦</div>
        <div className="confetti confetti-two">•</div>
        <div className="confetti confetti-three">✦</div>

        <div className="mascot">
          <div className="mascot-face">
            <span className="eye eye-left" />
            <span className="eye eye-right" />
            <span className="mouth" />
          </div>

          <span className="mascot-star">★</span>
        </div>

        <div className="title-decoration">
          <span />
          <span />
          <span />
        </div>

        <h1>
          Amigo Secreto
          <strong>por Colores</strong>
        </h1>

        <p className="subtitle">
          {mode === 'register'
            ? 'Regístrate y descubre qué color te tocó.'
            : 'Consulta nuevamente el color que te tocó.'}
        </p>

        <div className="mode-selector">
          <button
            type="button"
            className={mode === 'register' ? 'mode active' : 'mode'}
            onClick={() => {
              setMode('register')
              setError('')
            }}
          >
            Quiero participar
          </button>

          <button
            type="button"
            className={mode === 'consult' ? 'mode active' : 'mode'}
            onClick={() => {
              setMode('consult')
              setError('')
            }}
          >
            Olvidé mi Color
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nombre">¿Cómo te llamas?</label>

            <input
              id="nombre"
              type="text"
              placeholder="Escribe tu nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="clave">Tu palabra secreta</label>

            <input
              id="clave"
              type="password"
              placeholder="Solo tú la conoces"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button type="submit">
            <span className="button-icon">★</span>

            {mode === 'register'
              ? 'Descubrir mi color'
              : 'Consultar mi color'}

            <span className="button-arrow">→</span>
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="privacy">
          <span>🔒</span>
          <span>Tu color es secreto. Solo tú podrás verlo.</span>
        </div>
      </section>
    </main>
  )
}

export default App