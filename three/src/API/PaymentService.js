import axios from "axios";

export default class PaymentService {
  static async createCheckoutSession() {
    return axios.post(
      "http://127.0.0.1:8001/create-checkout-session",
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );
  }
}