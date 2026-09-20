import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { QUESTIONS } from "../lib/questions";

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_JSON to seed Firestore. No remote writes were made.");
  process.exit(1);
}
if (QUESTIONS.length !== 500 && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error(`Refusing to seed ${QUESTIONS.length} demo questions. Import all 500 source records first, or set ALLOW_DEMO_SEED=true for a test project.`);
  process.exit(1);
}
async function main() {
  const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string);
  const app = getApps()[0] ?? initializeApp({ credential: cert(credentials) });
  const db = getFirestore(app);
  const batches = [];
  for (let offset = 0; offset < QUESTIONS.length; offset += 400) {
    const batch = db.batch();
    QUESTIONS.slice(offset, offset + 400).forEach((question) => batch.set(db.collection("questions").doc(question.id), question));
    batches.push(batch.commit());
  }
  await Promise.all(batches);
  console.log(`Seeded ${QUESTIONS.length} questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
