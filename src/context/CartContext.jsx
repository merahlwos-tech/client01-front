import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext(null)

const ACTIONS = {
  ADD: 'ADD_TO_CART', REMOVE: 'REMOVE_FROM_CART',
  UPDATE_QTY: 'UPDATE_QUANTITY', CLEAR: 'CLEAR_CART', LOAD: 'LOAD_CART',
}

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD: return action.payload

    case ACTIONS.ADD: {
      const { product, size, quantity, doubleSided, selectedColors = [], numberOfColors = null } = action.payload
      const sizeObj   = product.sizes?.find(s => s.size === size)
      const basePrice = sizeObj?.price ?? product.computedPrice ?? 0
      const extra     = (doubleSided && product.doubleSided) ? (product.doubleSidedPrice ?? 0) : 0
      const unitPrice = basePrice + extra
      const colorKey  = [...selectedColors].sort().join(',')
      const key       = `${product._id}-${size}-${doubleSided ? '2' : '1'}-${colorKey}-${numberOfColors ?? 0}`
      const existing  = state.find(item => item.key === key)
      if (existing) {
        return state.map(item =>
          item.key === key ? { ...item, quantity } : item
        )
      }
      return [...state, {
        key, productId: product._id, name: product.name,
        price: unitPrice, image: product.images?.[0] || '',
        size, doubleSided: !!doubleSided,
        selectedColors, numberOfColors,
        quantity,
      }]
    }

    case ACTIONS.REMOVE:
      return state.filter(item => item.key !== action.payload)

    case ACTIONS.UPDATE_QTY:
      return state.map(item =>
        item.key === action.payload.key
          ? { ...item, quantity: action.payload.quantity }
          : item
      )

    case ACTIONS.CLEAR: return []
    default: return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart')
      if (stored) dispatch({ type: ACTIONS.LOAD, payload: JSON.parse(stored) })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // 1 produit = 1 dans le badge, peu importe la quantité d'unités
  const itemCount = items.length

  const addToCart = (product, size, quantity = 100, doubleSided = false, selectedColors = [], numberOfColors = null) =>
    dispatch({ type: ACTIONS.ADD, payload: { product, size, quantity, doubleSided, selectedColors, numberOfColors } })
  const removeFromCart = key => dispatch({ type: ACTIONS.REMOVE,     payload: key })
  const updateQuantity = (key, quantity) => dispatch({ type: ACTIONS.UPDATE_QTY, payload: { key, quantity } })
  const clearCart      = ()  => dispatch({ type: ACTIONS.CLEAR })

  return (
    <CartContext.Provider value={{ items, total, itemCount, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export default CartContext