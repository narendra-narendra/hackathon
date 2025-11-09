import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { SHOP_ITEMS, ShopCategory, ShopItem } from '../utils/shopItems'
import Header from '../components/Header'

type CategoryFilter = 'All' | ShopCategory

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All')
  const [minRating, setMinRating] = useState(4.5)

  const filteredItems = useMemo(() => {
    return SHOP_ITEMS.filter((item) => {
      const categoryMatch = activeCategory === 'All' || item.category === activeCategory
      const ratingMatch = item.rating >= minRating
      return categoryMatch && ratingMatch
    })
  }, [activeCategory, minRating])

  return (
    <>
      <Head>
        <title>Gear Shop | Sweat Socks Society</title>
        <meta
          name="description"
          content="Curated gear, nutrition, and recovery tools recommended by the Sweat Socks Society community."
        />
      </Head>

  <Header />

  <div className="min-h-screen bg-gray-50 pt-32 pb-16 px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="space-y-3 text-center md:text-left">
            <p className="uppercase tracking-wide text-sm text-blue-700/80">Community shop</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Dial in your training toolkit</h1>
            <p className="text-base text-slate-600 max-w-2xl">
              Hand-picked gear, hydration, and recovery essentials from athletes who train together every week.
            </p>
          </header>

          <section className="card" aria-label="Filters">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {(['All', 'Gear', 'Apparel', 'Recovery', 'Nutrition'] as CategoryFilter[]).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium ${
                      activeCategory === category
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                Min rating
                <select
                  value={minRating}
                  onChange={(event) => setMinRating(Number(event.target.value))}
                  className="rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <option value={4}>4.0+</option>
                  <option value={4.5}>4.5+</option>
                  <option value={4.7}>4.7+</option>
                  <option value={4.9}>4.9+</option>
                </select>
              </label>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2" aria-live="polite">
            {filteredItems.length === 0 ? (
              <div className="card md:col-span-2 text-center text-slate-500">
                No items match those filters just yet. Try easing the rating filter.
              </div>
            ) : (
              filteredItems.map((item) => (
                <article key={item.id} className="card flex flex-col gap-4">
                  <header className="space-y-1">
                    <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
                    <p className="text-sm text-slate-500">{item.category} · {item.vendor}</p>
                  </header>

                  <p className="text-sm text-slate-600 flex-1">{item.description}</p>

                  <div className="flex flex-wrap justify-between items-end gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">{item.price}</p>
                      <p className="text-slate-500">Community rating: {item.rating.toFixed(1)} / 5</p>
                      {item.highlight && (
                        <span className="inline-flex items-center text-xs uppercase tracking-wide text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                          {item.highlight}
                        </span>
                      )}
                    </div>
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm px-5"
                    >
                      Visit store
                    </Link>
                  </div>
                </article>
              ))
            )}
          </section>

          <section className="card grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Bundle ideas</h2>
              <p className="text-sm text-slate-600">
                Stack these favourites for the perfect training block.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <strong>Race week trio:</strong> Carbon Lace-Up shoes + Electrolyte mix + Trigger Pulse massage gun.
              </li>
              <li>
                <strong>Commuter kit:</strong> All-Weather reflective jacket + Tempo Trainer earbuds.
              </li>
              <li>
                <strong>Recovery reset:</strong> Infinity foam roller + 10-min guided mobility (see <Link href="/events" className="text-indigo-600 hover:underline">events</Link> for weekly sessions).
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
