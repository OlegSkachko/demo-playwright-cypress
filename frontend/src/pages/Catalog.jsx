import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductsContext'

export default function Catalog() {
  const { user } = useAuth()
  const { products, loading, error } = useProducts()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Все')

  const categories = useMemo(() => ['Все', ...new Set(products.map((p) => p.category))], [products])
  const visible = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === 'Все' || p.category === category) &&
          p.title.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [products, query, category]
  )

  return (
    <>
      <section className="hero">
        <span className="hero__eyebrow">Осенняя коллекция 2026</span>
        <h1 className="hero__title" data-testid="hero-title">
          {user ? `С возвращением, ${user.name.split(' ')[0]}!` : 'Техника, которая вдохновляет'}
        </h1>
        <p className="hero__subtitle">
          Отобранные гаджеты и вещи для дома с бесплатной доставкой от 5 000 ₽.
        </p>
      </section>

      <section className="toolbar">
        <div className="search">
          <span className="search__icon">⌕</span>
          <input
            className="input search__input"
            placeholder="Поиск товаров…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>
        <div className="filters" role="tablist">
          {categories.map((c) => (
            <button
              key={c}
              className={`filter ${c === category ? 'filter--active' : ''}`}
              onClick={() => setCategory(c)}
              data-testid={`filter-${c}`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <section className="grid">
          {Array.from({ length: 8 }, (_, i) => <div className="card card--skeleton" key={i} />)}
        </section>
      ) : error ? (
        <div className="empty" data-testid="catalog-error">
          <div className="empty__icon">⚠️</div>
          <p>Не удалось загрузить каталог: {error}</p>
        </div>
      ) : visible.length ? (
        <section className="grid" data-testid="product-grid">
          {visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </section>
      ) : (
        <div className="empty" data-testid="empty-search">
          <div className="empty__icon">🔍</div>
          <p>Ничего не нашлось. Попробуйте другой запрос.</p>
        </div>
      )}
    </>
  )
}
