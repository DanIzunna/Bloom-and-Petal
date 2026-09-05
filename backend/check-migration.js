require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const result = await client.query(
    `SELECT migration_name, checksum
     FROM "_prisma_migrations"
     WHERE migration_name = '20260904000000_init'`,
  );

  console.log(result.rows);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
