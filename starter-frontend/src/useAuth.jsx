import { supabase } from './supabaseClient'

export function useAuth() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // load current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    
    // listen for login/logout
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  return session
}