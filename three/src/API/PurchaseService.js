import API from "./api";

export default class PurchaseService {
  static async getMyTracks() {
    return API.get("/my-tracks");
  }

  static async createPurchase() {
    return API.post("/purchase");
  }

  static async getPurchases() {
    return API.get("/purchases");
  }
}