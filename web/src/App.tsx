import Navbar from './components/Navbar'
import Hero from './components/Hero'

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  )
}
