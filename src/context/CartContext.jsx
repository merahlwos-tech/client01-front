import { createContext, useContext, useReducer, useEffect } from 'react'
import { priceBreakdown } from '../utils/pricing'

const CartContext = createContext(null)

/* Ce qu'il faut garder d'un produit pour recalculer son prix dans le panier :
   la taille choisie avec ses paliers, et les suppléments. Sans ça, changer la
   quantité ne pouvait pas faire jouer les paliers dégressifs. */
function pricingSnapshot(product, size) {
  const sizeObj = product.sizes?.find(s => String(s.size) === String(size))
  return {
    sizes: sizeObj ? [{ size: sizeObj.size, price: sizeObj.price, priceTiers: sizeObj.priceTiers || [] }] : [],
    doubleSided:              !!product.doubleSided,
    doubleSidedPrice:         product.doubleSidedPrice ?? 0,
    colorDesignEnabled:       !!product.colorDesignEnabled,
    colorDesignPricePerColor: product.colorDesignPricePerColor ?? 0,
  }
}

/* Prix unitaire d'une ligne, avec la MÊME règle que la fiche produit et que
   le serveur (paliers + recto-verso + couleurs). Une ligne ancienne, sans
   instantané de prix, garde son prix : le serveur recalcule de toute façon. */
function linePrice(item, quantity) {
  if (!item.pricing?.sizes?.length) return item.price
  return priceBreakdown(item.pricing, item.size, quantity, item.doubleSided, item.numberOfColors).unitPrice
}

const ACTIONS = {
  ADD: 'ADD_TO_CART', REMOVE: 'REMOVE_FROM_CART',
  UPDATE_QTY: 'UPDATE_QUANTITY', CLEAR: 'CLEAR_CART', LOAD: 'LOAD_CART',
}

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD: return action.payload

    case ACTIONS.ADD: {
      const { product, size, quantity, doubleSided, selectedColors = [], numberOfColors = null } = action.payload
      /* L'ancien calcul prenait le prix de base de la taille AVANT le prix
         calculé par la fiche (paliers + couleurs), qui n'était donc jamais
         utilisé : le panier affichait et envoyait un autre prix que la fiche. */
      const pricing   = pricingSnapshot(product, size)
      const colorKey  = [...selectedColors].sort().join(',')
      const key       = `${product._id}-${size}-${doubleSided ? '2' : '1'}-${colorKey}-${numberOfColors ?? 0}`
      const base      = { size, doubleSided: !!doubleSided, numberOfColors, pricing }
      const unitPrice = pricing.sizes.length
        ? linePrice(base, quantity)
        : (product.computedPrice ?? 0)
      const existing  = state.find(item => item.key === key)
      if (existing) {
        return state.map(item =>
          item.key === key ? { ...item, quantity, pricing, price: unitPrice } : item
        )
      }
      return [...state, {
        key, productId: product._id, name: product.name,
        price: unitPrice, image: product.images?.[0] || '',
        size, doubleSided: !!doubleSided,
        selectedColors, numberOfColors,
        quantity, pricing,
      }]
    }

    case ACTIONS.REMOVE:
      return state.filter(item => item.key !== action.payload)

    // Changer la quantité fait jouer les paliers : le prix unitaire suit
    case ACTIONS.UPDATE_QTY:
      return state.map(item =>
        item.key === action.payload.key
          ? { ...item, quantity: action.payload.quantity, price: linePrice(item, action.payload.quantity) }
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