export const BASE_URL =
  location.hostname === "localhost" ? "http://localhost:8000" : "/api";

export const SOCKET_URL =
  location.hostname === "localhost"
    ? "http://localhost:8000"
    : `${location.protocol}//${location.hostname}:8000`;