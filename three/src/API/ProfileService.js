import API from "./api";

export default class ProfileService {
  static async getMe() {
    return API.get("/auth/me");
  }

  static async updateProfile(data) {
    return API.patch("/auth/me", data);
  }

  static async changeEmail(newEmail, currentPassword) {
    return API.post("/auth/change-email", {
      new_email: newEmail,
      current_password: currentPassword,
    });
  }

  static async changePassword(currentPassword, newPassword) {
    return API.post("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  static async uploadAvatar(formData) {
    return API.post("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
}
