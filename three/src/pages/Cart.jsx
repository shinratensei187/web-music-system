import React, { useEffect, useState } from "react";
import CartService from "../API/CartService";
import { useCart } from "../context/CartContext";
import Loader from "../Components/UI/loader/Loader";
import trackImage from "../image/trackImage.png";
import "../styles/Cart.css";
import { useNavigate } from "react-router-dom";
import PaymentService from "../API/PaymentService";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const { removeItem: removeCartItem } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const navigate = useNavigate();

  async function fetchCart() {
    try {
      setIsLoading(true);

      const response = await CartService.getCart();

      setCart(response.data);
    } catch (e) {
      alert("Помилка завантаження корзини");
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  }

  async function payCart() {
    try {
      setIsPaying(true);

      const response = await PaymentService.createCheckoutSession();

      window.location.href = response.data.url;
    } catch (e) {
      alert("Помилка створення оплати");
      console.log(e);
    } finally {
      setIsPaying(false);
    }
  }

  async function removeFromCart(trackId) {
    try {
      await removeCartItem(trackId);
      setCart(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.track.id !== trackId)
      } : null);
    } catch (e) {
      alert("Помилка видалення з корзини");
      console.log(e);
    }
  }

  useEffect(() => {
    fetchCart();
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  const items = cart?.items || [];

  const itemsTotal = items.reduce((sum, item) => {
    return sum + Number(item.track.price);
  }, 0);

  const total = itemsTotal;

  function getFileType(url) {
  if (!url) return "Файл";

  const cleanUrl = url.split("?")[0];
  const extension = cleanUrl.split(".").pop();

  if (!extension || extension.length > 5) return "Файл";

  return extension.toUpperCase();
}

  return (
    <div className="cartPage">
      <div className="cartContent">
        <div className="cartLeft">
          <h1 className="cartTitle">Кошик</h1>

          {items.length === 0 ? (
            <h2 className="emptyCart">Кошик порожній</h2>
          ) : (
            items.map((item) => (
              <div
                className="cartItem"
                key={item.id}
                onClick={() => navigate(`/posts/${item.track.id}`)}
              >
                <img
                  src={item.track.image_url || trackImage}
                  alt={item.track.title}
                  className="cartItemImage"
                />

                <div className="cartItemInfo">
                  <div className="cartItemTop">
                    <h3>{item.track.title}</h3>
                  </div>

                  <p className="cartTrackGenre">
                  </p>

                  <div className="cartTrackMeta">
                    <span>{getFileType(item.track.full_file_url)}</span>
                    <span>Standard License</span>
                  </div>

                  <button
                    className="licenseBtn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Переглянути додаток
                  </button>
                </div>

                  <div className="cartItemPrice">
                    {Number(item.track.price).toFixed(2)}₴
                  </div>

                <button
                  className="cartRemoveBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCart(item.track.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

       <div className="cartSummary">
  <div className="cartSummaryHeader">
    <div>
      <h2>Підсумок кошика</h2>
      <p>Перевірте замовлення перед оплатою</p>
    </div>

  </div>

  <div className="summaryInfoBox">
    <div className="summaryInfoItem">
    </div>
          </div>
          <div className="summaryTotal">
            <span>Разом до сплати</span>
            <strong>{total.toFixed(2)}₴</strong>
          </div>

          <button
            className="checkoutBtn"
            disabled={items.length === 0 || isPaying}
            onClick={payCart}
          >
            {isPaying ? "Перенаправлення..." : "Оформити покупку"}
          </button>

          <p className="summaryHint">
            Після успішної оплати треки будуть доступні у розділі ваших покупок.
          </p>
        </div>
      </div>
    </div>
  );
}