import API from "./api";

export default class CommentService {
  static async getComments(trackId) {
    return API.get(`/tracks/${trackId}/comments`);
  }

  static async addComment(trackId, content) {
    return API.post(`/tracks/${trackId}/comments`, { content });
  }

  static async deleteComment(commentId) {
    return API.delete(`/comments/${commentId}`);
  }
}
