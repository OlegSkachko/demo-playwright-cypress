import { formatPrice } from '../utils/format'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'

export default function ProductCard({ product }) {
  const { add } = useCart()
  const notify = useToast()

  const handleAdd = async () => {
    try {
      await add(product.id)
      notify(`«${product.title}» в корзине`)
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <article className="card" data-testid="product-card" data-product-id={product.id}>
      <div className="card__media" style={{ background: product.gradient }}>
        <span className="card__emoji">{product.emoji}</span>
        {product.badge && <span className="card__badge">{product.badge}</span>}
      </div>
      <div className="card__body">
        <div className="card__meta">
          <span className="chip" data-testid="product-category">{product.category}</span>
          <span className="rating">★ {product.rating}</span>
        </div>
        <h3 className="card__title" data-testid="product-title">{product.title}</h3>
        <p className="card__desc">{product.description}</p>
        <div className="card__footer">
          <span className="price" data-testid="product-price">{formatPrice(product.price)}</span>
          <button className="btn btn--primary" onClick={handleAdd} data-testid="add-to-cart">
            В корзину
          </button>
        </div>
      </div>
    </article>
  )
}
