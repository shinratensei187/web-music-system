import API from "./api";

export default class AuthService {
  static async register(name, email, password) {
    return API.post("/auth/register", {
      name,
      email,
      password,
    });
  }

  static async login(email, password) {
    return API.post("/auth/login", {
      email,
      password,
    });
  }

  static async getMe() {
    return API.get("/auth/me");
  }
}