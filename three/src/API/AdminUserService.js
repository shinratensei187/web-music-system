import API from "./api";

export default class AdminUserService {
  static async getAll() {
    return API.get("/admin/users");
  }

  static async toggleBlock(id) {
    return API.patch(`/admin/users/${id}/block`);
  }

  static async delete(id) {
    return API.delete(`/admin/users/${id}`);
  }
}