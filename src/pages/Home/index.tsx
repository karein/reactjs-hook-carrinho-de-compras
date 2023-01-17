import { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { api } from '../../services/api';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../util/format';

import { ProductList } from './styles';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

export interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const { addProduct, cart } = useCart();
  const [products, setProducts] = useState<ProductFormatted[]>([]);

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    sumAmount[product.id] = product.amount;
    return { ...sumAmount }
  }, {} as CartItemsAmount)

  useEffect(() => {
    async function loadProducts() {
      const response = await api.get('/products')
        .then(response => (
          response.data.map((product: Product) => ({ ...product, priceFormatted: formatPrice(product.price) }))
        ));

      // const formatedProduct = response.map(e => ({ ...e, priceFormatted: formatPrice(e.price) }))
      // setProducts(formatedProduct)

      setProducts(response)
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id)
  }

  return (
    <ProductList>
      {
        products.map(product => (
          <li key={product.id}>
            <img src={product.image} alt={product.title} />
            <strong>{product.title}</strong>
            <span>{product.priceFormatted}</span>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(product.id)}
            >
              <div data-testid="cart-product-quantity">
                <MdAddShoppingCart size={16} color="#FFF" />
                {cartItemsAmount[product.id] || 0}
              </div>

              <span>ADICIONAR AO CARRINHO</span>
            </button>
          </li>
        ))
      }
    </ProductList>
  );
};

export default Home;
