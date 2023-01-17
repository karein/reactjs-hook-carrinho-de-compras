import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const cartCopy = [...cart] //alterações no cartCopy não afetarão o cart, mas se fosse: const cartCopy = cart, afetaria
      const productInCart = cartCopy.find((product) => product.id === productId) // alterações productInCart afetam  o cartCopy, fazendo com o amount possa ser modificado diretamente
      const stokAmount = await api.get(`/stock/${productId}`).then(response => response.data)

      if (!productInCart) {
        const product = await api.get(`/products/${productId}`).then(response => response.data)
        cartCopy.push({ ...product, amount: 1 })

      } else {
        if (stokAmount.amount < productInCart.amount + 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }

        productInCart.amount += 1
      }

      setCart(cartCopy)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartCopy))
      return

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartCopy = [...cart];
      const findIndexProduct = cartCopy.findIndex((product) => product.id === productId);

      if (findIndexProduct !== -1) {
        cartCopy.splice(findIndexProduct, 1)
        setCart(cartCopy)

        localStorage.removeItem('@RocketShoes:cart')
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartCopy))

        return;
      } else {
        throw Error()
      }
    } catch {
      return toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const cartCopy = [...cart]
      const stokAmount = await api.get(`/stock/${productId}`).then(response => response.data)

      if (amount <= 0) {
        return
      }

      if (amount > stokAmount.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productInCart = cartCopy.find((product) => product.id === productId)

      if (productInCart) {
        productInCart.amount = amount
        setCart(cartCopy)

        localStorage.removeItem('@RocketShoes:cart')
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartCopy))
        return;
      }

      return;
    } catch {
      return toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
