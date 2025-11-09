import { useRouter } from 'next/router'
import { auth, db, storage } from '../config/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import AuthForm from '../components/AuthForm'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

export default function Register() {
  const router = useRouter()
  
  const handleRegister = async (email: string, password: string, userData: any = {}) => {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const { avatarFile, ...profileData } = userData || {}

      let avatarUrl: string | null = null
      if (avatarFile) {
        const extension = avatarFile.name.split('.').pop() || 'jpg'
        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.${extension}`)
        await uploadBytes(storageRef, avatarFile, {
          cacheControl: 'public,max-age=3600'
        })
        avatarUrl = await getDownloadURL(storageRef)
      }
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        uid: user.uid,
        avatar: avatarUrl,
        createdAt: new Date().toISOString()
      })

      console.log('Registered user:', user)
  router.push('/')
    } catch (error: any) {
      console.error('Registration error:', error)
      // Extract the specific Firebase error message
      const errorMessage = error.message || 'Registration failed'
      throw new Error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-white">
      <div className="w-full max-w-2xl px-6">
        <AuthForm mode="register" onSubmit={handleRegister} />
      </div>
    </div>
  )
}
