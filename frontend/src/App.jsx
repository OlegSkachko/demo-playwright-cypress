import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Catalog from './pages/Catalog'
import Login from './pages/Login'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'
import { useAuth } from './context/AuthContext'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}

export default function App() {
  return (
    <div className="app">
      <div className="bg-blob bg-blob--1" />
      <div className="bg-blob bg-blob--2" />
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/success/:orderId" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">Lumen Store · демо-приложение для e2e-тестов</footer>
    </div>
  )
}
