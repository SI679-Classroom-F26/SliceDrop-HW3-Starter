import { app } from "./app";
import { DB_NAME, MONGO_URI, PORT } from "./constants";
import { connect } from "./db/db";
import { seedMenuIfEmpty, seedStaffIfEmpty } from "./seed/seed";

// The order here matters: connect, seed, THEN listen. A server that
// accepts requests before its database is ready answers them with errors.
// Note that app.ts never connects -- the tests connect to an in-memory
// Mongo instead, and the app neither knows nor cares.
async function main(): Promise<void> {
  await connect(MONGO_URI, DB_NAME);
  await seedMenuIfEmpty();
  await seedStaffIfEmpty();

  app.listen(PORT, () => {
    console.log(`SliceDrop listening on http://localhost:${PORT}`);
  });
}

main();
