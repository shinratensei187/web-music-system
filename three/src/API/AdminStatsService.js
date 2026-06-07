import API from "./api";

export default class AdminStatsService {
  static async getStats() {
    return API.get("/admin/stats");
  }
}