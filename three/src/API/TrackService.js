import API from "./api";

export default class TrackService {
  static async getAll() {
    return API.get("/tracks");
  }

  static async getById(id) {
    return API.get(`/tracks/${id}`);
  }

  static async create(track) {
    return API.post("/tracks", track);
  }

  static async update(id, track) {
    return API.put(`/tracks/${id}`, track);
  }

  static async delete(id) {
    return API.delete(`/tracks/${id}`);
  }

  static async createWithFiles(formData) {
    return API.post("/tracks/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  }

  static async getAdminInfo() {
    return API.get("/admin/tracks-info");
  }
}