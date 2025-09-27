export const HOST = import.meta.env.VITE_SERVER_URL;

export const AUTH_ROUTES = "api/auth";
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/signup`
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`;

// Messages endpoints
export const MESSAGE_ROUTES = "api/messages";
export const GET_MESSAGES = `${MESSAGE_ROUTES}/get-messages`;
export const SEND_MESSAGE = `${MESSAGE_ROUTES}/send-message`;
export const CONTACTS = `${MESSAGE_ROUTES}/contacts`;
export const REQUESTS = `${MESSAGE_ROUTES}/requests`;
export const ACCEPT_REQUEST = (id) => `${MESSAGE_ROUTES}/requests/${id}/accept`;
export const REJECT_REQUEST = (id) => `${MESSAGE_ROUTES}/requests/${id}/reject`;
export const ALL_USERS = `${MESSAGE_ROUTES}/all-users`;
export const FIND_BY_USERNAME = `${MESSAGE_ROUTES}/find-by-username`;

