import API from "./api";

export default class CartService {
  static async getCart() {
    return API.get("/cart");
  }

  static async add(trackId) {
    return API.post(`/cart/${trackId}`);
  }

  static async remove(trackId) {
    return API.delete(`/cart/${trackId}`);
  }
}