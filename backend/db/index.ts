import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new SQLDatabase("civic_platform", {
  migrations: "./migrations",
});
