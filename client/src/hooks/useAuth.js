import { useAuthContext } from '../features/auth/authContext';

export const useAuth = () => {
  return useAuthContext();
};
