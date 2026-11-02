import { useEffect, useState } from 'react'
import './ServerStatus.css'

type Status = 'checking' | 'connected' | 'offline'

const STATUS_TEXT: Record<Status, string> = {
  checking: 'Checking server...',
  connected: 'Server connected',
  offline: 'Server offline',
}

export default function ServerStatus() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'ok') {
          setStatus('connected')
          return
        }
        setStatus('offline')
      })
      .catch(() => {
        setStatus('offline')
      })
  }, [])

  return <p className="server-status">{STATUS_TEXT[status]}</p>
}