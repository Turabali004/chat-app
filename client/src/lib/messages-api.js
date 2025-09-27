import { apiClient } from "../../lib/api-client";
import {
  GET_MESSAGES,
  SEND_MESSAGE,
  CONTACTS,
  REQUESTS,
  ACCEPT_REQUEST,
  REJECT_REQUEST,
  ALL_USERS,
  FIND_BY_USERNAME,
} from "../../utils/constants";

export const fetchMessages = (userId, page = 1, limit = 30) =>
  apiClient.post(GET_MESSAGES, { userId, page, limit });

export const sendMessage = ({ receiver, content, messageType = "text" }) =>
  apiClient.post(SEND_MESSAGE, { receiver, content, messageType });

export const fetchContacts = () => apiClient.get(CONTACTS);
export const fetchRequests = () => apiClient.get(REQUESTS);
export const acceptRequest = (threadId) => apiClient.post(ACCEPT_REQUEST(threadId));
export const rejectRequest = (threadId) => apiClient.post(REJECT_REQUEST(threadId));
export const fetchAllUsers = () => apiClient.get(ALL_USERS);
export const findByUsername = (username) => apiClient.get(`${FIND_BY_USERNAME}?username=${encodeURIComponent(username)}`);