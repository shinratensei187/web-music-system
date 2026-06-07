import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PurchaseService from "../API/PurchaseService";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    async function createPurchase() {
      try {
        await PurchaseService.createPurchase();
        navigate("/my-tracks");
      } catch (e) {
        alert("Помилка завершення покупки");
        console.log(e);
      }
    }

    createPurchase();
  }, []);

  return (
    <div className="App">
      <h1 style={{ color: "white", marginTop: 40 }}>
        Оплата успішна, покупка обробляється...
      </h1>
    </div>
  );
}