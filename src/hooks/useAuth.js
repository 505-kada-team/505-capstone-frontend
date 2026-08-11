// Mock useAuth until real AuthContext is implemented
export function useAuth() {
  return {
    user: { name: 'Admin A' },
    role: 'admin',
    logout: () => console.log('logout'),
  };
}
