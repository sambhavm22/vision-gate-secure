import { useState, useEffect } from 'react'
import { supabase } from '@vision-gate/supabase/client'
import './App.css'

function App() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  return (
    <>
      <h1>Worker App</h1>
      <div className="card">
        {session ? (
          <p>Logged in as {session.user.email}</p>
        ) : (
          <p>Not logged in. Check console for Supabase connection.</p>
        )}
      </div>
      <p className="read-the-docs">
        Powered by @vision-gate/supabase
      </p>
    </>
  )
}

export default App
