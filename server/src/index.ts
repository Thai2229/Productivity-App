import cors from 'cors'
import express from 'express'

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT)
})