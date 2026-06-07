import axios from "axios";
export default class PaymentService {
  static async createCheckoutSession() {
    return axios.post(
      "https://web-music-system-production.up.railway.app/create-checkout-session",
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );
  }
}