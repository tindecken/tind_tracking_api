export const env = {
  TURSO_DATABASE_URL: Bun.env.TURSO_DATABASE_URL!,
  TURSO_AUTH_TOKEN: Bun.env.TURSO_AUTH_TOKEN!,
  PORT: Number(Bun.env.PORT ?? 3000),
};
