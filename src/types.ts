export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
}
