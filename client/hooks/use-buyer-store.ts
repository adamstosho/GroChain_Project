import { create } from 'zustand'
import { useEffect } from 'react'
import { apiService } from '@/lib/api'

interface BuyerState {
  profile: any
  favorites: any[]
  cart: any[]
  orders: any[]
  notifications: any[]
  isLoading: boolean
  error: string | null

  // Actions
  initializeCart: () => void
  fetchProfile: () => Promise<void>
  updateProfile: (data: any) => Promise<void>
  fetchFavorites: () => Promise<void>
  addToFavorites: (listingId: string, notes?: string) => Promise<void>
  removeFromFavorites: (listingId: string) => Promise<void>
  addToCart: (product: any, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  clearStoredCart: () => void
  getCartSummary: () => any
  fetchOrders: () => Promise<void>
  createOrder: (orderData: any) => Promise<any>
  fetchNotifications: () => Promise<void>
  markNotificationAsRead: (notificationId: string) => Promise<void>
  getCurrentUserId: () => string | null
}

// Cart persistence functions
const CART_STORAGE_KEY = 'grochain-buyer-cart'

const saveCartToStorage = (cart: any[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error)
    }
  }
}

const loadCartFromStorage = (): any[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to load cart from localStorage:', error)
      return []
    }
  }
  return [] // Return empty array for SSR
}

export const useBuyerStore = create<BuyerState>((set, get) => ({
  profile: null,
  favorites: [],
  cart: loadCartFromStorage(), // Initialize with cart from localStorage
  orders: [],
  notifications: [],
  isLoading: false,
  error: null,

  // Initialize cart from localStorage after hydration
  initializeCart: () => {
    if (typeof window !== 'undefined') {
      const storedCart = loadCartFromStorage()
      set({ cart: storedCart })
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiService.getProfile()
      set({ profile: response.data, isLoading: false })
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      set({ error: error.message || 'Failed to load profile', isLoading: false })
    }
  },

  updateProfile: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiService.updateProfile(data)
      set({ profile: response.data, isLoading: false })
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      set({ error: error.message || 'Failed to update profile', isLoading: false })
    }
  },

  fetchFavorites: async () => {
    set({ isLoading: true, error: null })
    try {
      // First try to get user ID from profile
      let userId = get().profile?._id
      
      // If no profile, try to get from getCurrentUserId method
      if (!userId) {
        userId = get().getCurrentUserId()
      }
      
      // If still no userId, try to fetch profile first
      if (!userId) {
        console.log('No user ID found, attempting to fetch profile first...')
        try {
          await get().fetchProfile()
          userId = get().profile?._id
        } catch (profileError) {
          console.error('Failed to fetch profile:', profileError)
        }
      }
      
      console.log('Fetching favorites for user:', userId || 'current user')
      
      // Always use the current user endpoint to avoid authentication issues
      const response = await apiService.getFavorites()
      console.log('Favorites API response:', response)
      
      const favorites = (response.data as any)?.favorites || (response.data as any) || []
      console.log('Parsed favorites:', favorites)
      set({ favorites, isLoading: false })
    } catch (error: any) {
      console.error('Failed to fetch favorites:', error)
      set({ error: error.message || 'Failed to load favorites', isLoading: false })
    }
  },

  addToFavorites: async (listingId: string, notes?: string) => {
    try {
      console.log('Adding to favorites:', { listingId, notes })
      const response = await apiService.addToFavorites(listingId, notes)
      console.log('Add to favorites response:', response)
      
      // Refresh favorites after adding
      const userId = get().profile?._id || get().getCurrentUserId()
      if (userId) {
        const favoritesResponse = await apiService.getFavorites(userId)
        const favorites = (favoritesResponse.data as any)?.favorites || (favoritesResponse.data as any) || []
        set({ favorites })
      }
    } catch (error: any) {
      console.error('Failed to add to favorites:', error)
      set({ error: error.message || 'Failed to add to favorites' })
      throw error // Re-throw to let the calling component handle it
    }
  },

  removeFromFavorites: async (listingId: string) => {
    try {
      const userId = get().profile?._id || get().getCurrentUserId()
      if (!userId) {
        throw new Error('User not authenticated')
      }
      
      await apiService.removeFromFavorites(userId, listingId)
      // Refresh favorites after removing
      const response = await apiService.getFavorites(userId)
      const favorites = (response.data as any)?.favorites || (response.data as any) || []
      set({ favorites })
    } catch (error: any) {
      console.error('Failed to remove from favorites:', error)
      set({ error: error.message || 'Failed to remove from favorites' })
    }
  },

  addToCart: async (cartItem: any, quantity?: number) => {
    try {
      // Handle both formats: raw product object or pre-formatted cartItem
      const itemToAdd = cartItem.id ? cartItem : {
        id: cartItem._id || cartItem.id,
        listingId: cartItem._id || cartItem.listingId || cartItem.id,
        cropName: cartItem.cropName || cartItem.name,
        quantity: quantity || cartItem.quantity || 1,
        unit: cartItem.unit,
        price: cartItem.price || cartItem.basePrice,
        total: (cartItem.price || cartItem.basePrice) * (quantity || cartItem.quantity || 1),
        farmer: cartItem.farmer || 'Unknown Farmer',
        location: cartItem.location,
        image: cartItem.image || "/placeholder.svg",
        availableQuantity: cartItem.availableQuantity || 0
      }

      const existingItem = get().cart.find(item => item.id === itemToAdd.id)
      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + itemToAdd.quantity
        await get().updateCartQuantity(itemToAdd.id, newQuantity)
      } else {
        // Reserve quantity in backend before adding to cart
        try {
          await apiService.reserveCartQuantity([{
            listingId: itemToAdd.listingId,
            quantity: itemToAdd.quantity
          }])

          set(state => {
            const newCart = [...state.cart, itemToAdd]
            saveCartToStorage(newCart) // Save to localStorage
            return { cart: newCart }
          })
        } catch (error) {
          console.error('Failed to reserve cart quantity:', error)
          throw error // Re-throw to let caller handle it
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  },

    removeFromCart: async (productId: string) => {
    try {
      const cartItem = get().cart.find(item => item.id === productId)
      if (cartItem) {
        // Release quantity in backend before removing from cart
        try {
          await apiService.releaseCartQuantity([{
            listingId: cartItem.listingId,
            quantity: cartItem.quantity
          }])
        } catch (error) {
          console.error('Failed to release cart quantity:', error)
          // Continue with cart removal even if backend call fails
        }
      }

      set(state => {
        const newCart = state.cart.filter(item => item.id !== productId)
        saveCartToStorage(newCart) // Save to localStorage
        return { cart: newCart }
      })
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  },

  updateCartQuantity: async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await get().removeFromCart(productId)
        return
      }

      const cartItem = get().cart.find(item => item.id === productId)
      if (!cartItem) {
        throw new Error('Cart item not found')
      }

      const oldQuantity = cartItem.quantity
      const quantityDifference = quantity - oldQuantity

      if (quantityDifference !== 0) {
        // Update quantity in backend
        try {
          await apiService.updateCartItemQuantity(cartItem.listingId, oldQuantity, quantity)
        } catch (error) {
          console.error('Failed to update cart item quantity in backend:', error)
          throw error
        }
      }

      // Update cart in store
      set(state => {
        const newCart = state.cart.map(item =>
          item.id === productId
            ? { ...item, quantity, total: item.price * quantity }
            : item
        )
        saveCartToStorage(newCart) // Save to localStorage
        return { cart: newCart }
      })
    } catch (error) {
      console.error('Error updating cart quantity:', error)
      throw error
    }
  },

  clearCart: () => {
    const emptyCart: any[] = []
    saveCartToStorage(emptyCart) // Save to localStorage
    set({ cart: emptyCart })
  },

  // Utility function to manually clear cart from localStorage (for debugging)
  clearStoredCart: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CART_STORAGE_KEY)
        console.log('🗑️ Cart cleared from localStorage')
      } catch (error) {
        console.warn('Failed to clear cart from localStorage:', error)
      }
    }
  },

  // Get cart summary for debugging
  getCartSummary: () => {
    const cart = get().cart
    return {
      itemCount: cart.length,
      totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: cart.reduce((sum, item) => sum + item.total, 0),
      items: cart.map(item => ({
        name: item.cropName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }))
    }
  },

  getCurrentUserId: () => {
    const profile = get().profile
    return profile?._id || null
  },

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      console.log('📦 Fetching orders from backend...')
      const response = await apiService.getUserOrders()
      console.log('📋 Orders response:', response)

      let orders = []
      if ((response as any)?.data?.data?.orders) {
        orders = (response as any).data.data.orders
      } else if ((response as any)?.data?.orders) {
        orders = (response as any).data.orders
      } else if ((response as any)?.data) {
        orders = Array.isArray((response as any).data) ? (response as any).data : []
      }

      console.log('✅ Processed orders:', orders.length, 'orders')
      set({ orders: Array.isArray(orders) ? orders : [], isLoading: false })
    } catch (error: any) {
      console.error('❌ Failed to fetch orders:', error)
      set({ error: error.message || 'Failed to load orders', isLoading: false })
    }
  },

  createOrder: async (orderData: any) => {
    set({ isLoading: true, error: null })
    try {
      console.log('🛒 Creating order with data:', orderData)
      const response = await apiService.createOrder(orderData)
      console.log('✅ Order creation response:', response)

      if (response?.status === 'success' && response?.data) {
        // Add the new order to the orders list
        const newOrders = [...get().orders, response.data]
        set({ orders: newOrders, isLoading: false })

        // Clear cart after successful order
        get().clearCart()

        console.log('🎉 Order created successfully:', response.data._id)
        return response.data
      } else {
        throw new Error(response?.message || 'Failed to create order')
      }
    } catch (error: any) {
      console.error('❌ Order creation failed:', error)
      set({ error: error.message || 'Failed to create order', isLoading: false })
      throw error
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiService.getUserNotifications()
      set({ notifications: (response.data as any)?.notifications || [], isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId)
      set(state => ({
        notifications: state.notifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },
}))

// Custom hook to ensure cart is initialized on component mount
export const useCartInitialization = () => {
  useEffect(() => {
    // Ensure cart is loaded from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedCart = loadCartFromStorage()
      const currentCart = useBuyerStore.getState().cart

      // Only update if the stored cart is different from current cart
      if (JSON.stringify(storedCart) !== JSON.stringify(currentCart)) {
        useBuyerStore.getState().initializeCart()
      }
    }
  }, [])
}

