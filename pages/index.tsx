import Hero from '../components/Hero'
import Footer from '../components/Footer'

export default function Home(){
  return (
    <div className="min-h-screen">
      <Hero />
      <main className="py-20 px-6 md:px-20">
        <section className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">How Sweat Socks Society works</h2>
          <p className="text-gray-700">Sweat Socks Society matches you with nearby workout buddies based on goals, vibe, and schedule. Create or join activities, swap tips, and stay motivated together.</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
