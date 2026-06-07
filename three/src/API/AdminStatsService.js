import axios from "axios";

const API_URL = "http://127.0.0.1:8001";

export default class AdminStatsService {
  static getHeaders() {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`
    };
  }

  static async getStats() {
    return axios.get(`${API_URL}/admin/stats`, {
      headers: this.getHeaders()
    });
  }
}