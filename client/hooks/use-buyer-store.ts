import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
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

const CART_STORAGE_KEY = 'grochain-buyer-cart'

export const useBuyerStore = create<BuyerState>()(
  persist(
    (set, get) => ({
      profile: null,
      favorites: [],
      cart: [],
      orders: [],
      notifications: [],
      isLoading: false,
      error: null,

      fetchProfile: async () => {
        set({ isLoading: true, error: null })
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('grochain_auth_token') : null
          if (!token || token === 'undefined' || token === 'null') {
            set({ profile: null, isLoading: false, error: null })
            return
          }

          const response = await apiService.getProfile()
          set({ profile: response.data, isLoading: false })
        } catch (error: any) {
          if (error.message?.includes('timeout')) {
            set({ 
              error: 'Server timeout. Please try again.', 
              isLoading: false 
            })
          } else if (error.message?.includes('Invalid token') || error.message?.includes('Unauthorized')) {
            set({ profile: null, isLoading: false, error: null })
          } else {
            set({ error: error.message || 'Failed to load profile', isLoading: false })
          }
        }
      },

      updateProfile: async (data: any) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiService.updateProfile(data)
          set({ profile: response.data, isLoading: false })
        } catch (error: any) {
          set({ error: error.message || 'Failed to update profile', isLoading: false })
        }
      },

      fetchFavorites: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('grochain_auth_token') : null
        if (!token || token === 'undefined' || token === 'null' || token.length < 10) {
          set({ favorites: [], isLoading: false, error: null })
          return
        }

        set({ isLoading: true, error: null })
        try {
          let userId = get().profile?._id || get().getCurrentUserId()
          
          if (!userId) {
            await get().fetchProfile()
            userId = get().profile?._id
          }
          
          if (!userId) {
            set({ favorites: [], isLoading: false })
            return
          }
          
          const response = await apiService.getFavorites()
          const favorites = (response.data as any)?.favorites || (response.data as any) || []
          set({ favorites, isLoading: false })
        } catch (error: any) {
          set({ favorites: [], isLoading: false, error: null })
        }
      },

      addToFavorites: async (listingId: string, notes?: string) => {
        try {
          await apiService.addToFavorites(listingId, notes)
          const userId = get().profile?._id || get().getCurrentUserId()
          if (userId) {
            const favoritesResponse = await apiService.getFavorites()
            const favorites = (favoritesResponse.data as any)?.favorites || (favoritesResponse.data as any) || []
            set({ favorites })
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to add to favorites' })
          throw error
        }
      },

      removeFromFavorites: async (listingId: string) => {
        try {
          const userId = get().profile?._id || get().getCurrentUserId()
          if (!userId) throw new Error('User not authenticated')
          
          await apiService.removeFromFavorites(userId, listingId)
          const response = await apiService.getFavorites()
          const favorites = (response.data as any)?.favorites || (response.data as any) || []
          set({ favorites })
        } catch (error: any) {
          set({ error: error.message || 'Failed to remove from favorites' })
        }
      },

      addToCart: async (cartItem: any, quantity?: number) => {
        try {
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
            const newQuantity = existingItem.quantity + itemToAdd.quantity
            get().updateCartQuantity(itemToAdd.id, newQuantity)
          } else {
            const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
            
            if (!isOffline) {
              try {
                await apiService.reserveCartQuantity([{
                  listingId: itemToAdd.listingId,
                  quantity: itemToAdd.quantity
                }])
              } catch (error) {
                console.error('Failed to reserve cart quantity:', error)
              }
            }

            set(state => ({ cart: [...state.cart, itemToAdd] }))
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
            try {
              await apiService.releaseCartQuantity([{
                listingId: cartItem.listingId,
                quantity: cartItem.quantity
              }])
            } catch (error) {
              console.error('Failed to release cart quantity:', error)
            }
          }

          set(state => ({
            cart: state.cart.filter(item => item.id !== productId)
          }))
        } catch (error) {
          console.error('Error removing from cart:', error)
          throw error
        }
      },

      updateCartQuantity: async (productId: string, quantity: number) => {
        try {
          if (quantity <= 0) {
            get().removeFromCart(productId)
            return
          }

          const cartItem = get().cart.find(item => item.id === productId)
          if (!cartItem) throw new Error('Cart item not found')

          const oldQuantity = cartItem.quantity
          const quantityDifference = quantity - oldQuantity

          if (quantityDifference !== 0) {
            try {
              await apiService.updateCartItemQuantity(cartItem.listingId, oldQuantity, quantity)
            } catch (error) {
              console.error('Failed to update cart item quantity:', error)
              throw error
            }
          }

          set(state => ({
            cart: state.cart.map(item =>
              item.id === productId
                ? { ...item, quantity, total: item.price * quantity }
                : item
            )
          }))
        } catch (error) {
          console.error('Error updating cart quantity:', error)
          throw error
        }
      },

      clearCart: () => set({ cart: [] }),

      clearStoredCart: () => {
        if (typeof window !== 'undefined') localStorage.removeItem(CART_STORAGE_KEY)
      },

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

      getCurrentUserId: () => get().profile?._id || null,

      fetchOrders: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiService.getUserOrders()
          let orders = []
          if ((response as any)?.data?.data?.orders) {
            orders = (response as any).data.data.orders
          } else if ((response as any)?.data?.orders) {
            orders = (response as any).data.orders
          } else if ((response as any)?.data) {
            orders = Array.isArray((response as any).data) ? (response as any).data : []
          }
          set({ orders: Array.isArray(orders) ? orders : [], isLoading: false })
        } catch (error: any) {
          set({ error: error.message || 'Failed to load orders', isLoading: false })
        }
      },

      createOrder: async (orderData: any) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiService.createOrder(orderData)
          if (response?.status === 'success' && response?.data) {
            set(state => ({ 
              orders: [...state.orders, response.data],
              isLoading: false 
            }))
            get().clearCart()
            return response.data
          } else {
            throw new Error(response?.message || 'Failed to create order')
          }
        } catch (error: any) {
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
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cart: state.cart }),
    }
  )
)


