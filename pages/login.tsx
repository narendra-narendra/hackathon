import { useRouter } from 'next/router'
import { auth } from '../config/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import AuthForm from '../components/AuthForm'

export default function Login(){
  const router = useRouter()
  
  const handleLogin = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log('Logged in user:', user)
  router.push('/')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-white">
      <div className="w-full max-w-2xl px-6">
        <AuthForm mode="login" onSubmit={handleLogin} />
      </div>
    </div>
  )
}
