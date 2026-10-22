export default function OrderStatus({ status, label }) {
  return (
    <span className={`status status--${status}`} data-testid="order-status" data-status={status}>
      {label}
    </span>
  )
}
