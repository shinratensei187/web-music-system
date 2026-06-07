import axios from "axios";

const API_URL = "http://127.0.0.1:8001";

export default class AdminUserService {
  static getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`
    };
  }

  static async getAll() {
    return axios.get(`${API_URL}/admin/users`, {
      headers: this.getAuthHeaders()
    });
  }

  static async toggleBlock(id) {
    return axios.patch(`${API_URL}/admin/users/${id}/block`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  static async delete(id) {
    return axios.delete(`${API_URL}/admin/users/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}