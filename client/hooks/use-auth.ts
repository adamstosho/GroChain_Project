import { useAuthStore, useAuthGuard } from '@/lib/auth'

export const useAuth = () => {
  const { 
    user, 
    token, 
    isAuthenticated, 
    login, 
    logout, 
    register, 
    refreshAuth,
    updateUser,
    updateUserAvatar
  } = useAuthStore()

  const authGuard = useAuthGuard()

  return {
    ...authGuard,
    user,
    token,
    isAuthenticated,
    login,
    logout,
    register,
    refreshAuth,
    updateUser,
    updateUserAvatar
  }
}
