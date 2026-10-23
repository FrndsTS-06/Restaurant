import { useCartContext } from '../features/cart/cartContext';

export const useCart = () => {
  return useCartContext();
};
