import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { cartApi } from '../services/api';
import toast from 'react-hot-toast';

// ==============================
// Cart Context
// ==============================
const CartContext = createContext(null);

// Cart Actions
const CART_ACTIONS = {
  SET_CART: 'SET_CART',
  SET_LOADING: 'SET_LOADING',
  TOGGLE_MINI_CART: 'TOGGLE_MINI_CART',
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_CART:
      return { ...state, cart: action.payload, loading: false };
    case CART_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case CART_ACTIONS.TOGGLE_MINI_CART:
      return { ...state, isMiniCartOpen: action.payload ?? !state.isMiniCartOpen };
    default:
      return state;
  }
};

const initialState = {
  cart: null,
  loading: false,
  isMiniCartOpen: false,
};

// ==============================
// CartProvider
// ==============================
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Lấy cart khi component mount
  const fetchCart = useCallback(async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      const response = await cartApi.getCart();
      dispatch({ type: CART_ACTIONS.SET_CART, payload: response.data });
    } catch {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  const addToCart = useCallback(async ({ productId, size, color, quantity = 1 }) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      const response = await cartApi.addItem({ productId, size, color, quantity });
      dispatch({ type: CART_ACTIONS.SET_CART, payload: response.data });
      // Mở mini cart sau khi thêm thành công
      dispatch({ type: CART_ACTIONS.TOGGLE_MINI_CART, payload: true });
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (error) {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
      toast.error(error.message || 'Không thể thêm vào giỏ hàng');
      throw error;
    }
  }, []);

  /**
   * Cập nhật số lượng item
   */
  const updateItem = useCallback(async (itemId, quantity) => {
    try {
      const response = await cartApi.updateItem(itemId, { quantity });
      dispatch({ type: CART_ACTIONS.SET_CART, payload: response.data });
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  /**
   * Xóa item khỏi giỏ
   */
  const removeItem = useCallback(async (itemId) => {
    try {
      const response = await cartApi.removeItem(itemId);
      dispatch({ type: CART_ACTIONS.SET_CART, payload: response.data });
      toast.success('Đã xóa khỏi giỏ hàng');
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  const toggleMiniCart = useCallback((open) => {
    dispatch({ type: CART_ACTIONS.TOGGLE_MINI_CART, payload: open });
  }, []);

  // Computed values
  const totalItems = state.cart?.totalItems ?? 0;
  const subtotal = state.cart?.subtotal ?? 0;
  const items = state.cart?.items ?? [];

  const value = {
    cart: state.cart,
    items,
    totalItems,
    subtotal,
    loading: state.loading,
    isMiniCartOpen: state.isMiniCartOpen,
    addToCart,
    updateItem,
    removeItem,
    toggleMiniCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

/**
 * Custom hook để dùng Cart Context
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được dùng bên trong CartProvider');
  }
  return context;
};
