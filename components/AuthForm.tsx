import { useState, useRef } from 'react'
import { useRouter } from 'next/router'

type Props = {
  mode: 'login' | 'register'
  onSubmit: (email: string, password: string, userData?: any) => Promise<void>
}

export default function AuthForm({ mode, onSubmit }: Props) {
  const isRegister = mode === 'register'
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [gender, setGender] = useState('')
  const [location, setLocation] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [level, setLevel] = useState('Beginner')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAvatarError('Please choose an image file (JPG, PNG, or GIF).')
        return
      }
      if (file.size > MAX_AVATAR_SIZE) {
        setAvatarError('Avatar files must be smaller than 5MB.')
        return
      }
      setAvatarError(null)
      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatar(null)
    setAvatarPreview('')
    setAvatarError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (isRegister) {
        if (!name || !email || !password || !location || password !== confirm) {
          alert('Please complete all required fields (including location) and ensure passwords match.')
          return
        }
        if (password.length < 6) {
          alert('Password must be at least 6 characters long')
          return
        }
        
        // Upload avatar if selected
        const userData = { 
          name, 
          mobile, 
          age, 
          gender, 
          location, 
          interests, 
          level,
          avatarFile: avatar
        }
        await onSubmit(email, password, userData)
        alert('Registration successful')
      } else {
        if (!email || !password) {
          alert('Enter email and password')
          return
        }
        await onSubmit(email, password)
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      alert(error.message || 'Authentication failed. Please try again.')
    }
  }

  return (
    <div className="max-w-md w-full mx-auto mt-12 card">
  <h2 className="text-2xl font-semibold mb-4">{isRegister ? 'Create your Sweat Socks Society account' : 'Welcome back'}</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <div className="flex items-center gap-4 mb-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  aria-label={avatar ? 'Change profile image' : 'Upload profile image'}
                >
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full border rounded px-3 py-2" 
                  placeholder="Name" 
                />
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
              {avatar && (
                <button type="button" onClick={removeAvatar} className="text-gray-500 hover:underline">
                  Remove image
                </button>
              )}
              <span>Optional • JPG/PNG/GIF up to 5MB</span>
            </div>
            {avatarError && (
              <p className="text-xs text-red-600 mb-2">{avatarError}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <input value={mobile} onChange={e => setMobile(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Mobile Number" />
              <input value={age as any} onChange={e => setAge(Number(e.target.value) || '')} className="w-full border rounded px-3 py-2" placeholder="Age" />
            </div>
            <input 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
              className="w-full border rounded px-3 py-2" 
              placeholder="Your Location (City, State)"
            />
            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select Gender</option>
              <option>Female</option>
              <option>Male</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </select>
          </>
        )}

        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2" placeholder="Password" />

        {isRegister && (
          <>
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" className="w-full border rounded px-3 py-2" placeholder="Re-enter Password" />

            <div>
              <div className="text-sm mb-2">Activity Interest</div>
              <div className="flex gap-2">
                {['Run', 'Bike', 'Swim'].map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleInterest(i)}
                    className={`px-3 py-2 rounded-full border ${interests.includes(i) ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm mb-2">Activity Level</div>
              <select value={level} onChange={e => setLevel(e.target.value)} className="w-full border rounded px-3 py-2">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">{isRegister ? 'Register' : 'Login'}</button>
        </div>
      </form>
    </div>
  )
}
