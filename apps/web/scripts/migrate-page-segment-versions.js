/* eslint-disable no-console */
const path = require("path");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

const envLocalPath = path.join(__dirname, "..", ".env.local");
const envPath = path.join(__dirname, "..", ".env");

dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error(
    "Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID or FIREBASE_PROJECT_ID in environment.",
  );
  process.exit(1);
}

const appOptions = {
  projectId,
};

if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  appOptions.credential = admin.credential.cert({
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
}

admin.initializeApp(appOptions);
const db = admin.firestore();

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const deleteOld = args.has("--delete-old");

async function migrate() {
  let migrated = 0;
  let skipped = 0;
  let deleted = 0;
  let batches = 0;

  const projectsSnapshot = await db.collection("projects").get();

  for (const projectDoc of projectsSnapshot.docs) {
    const pagesSnapshot = await projectDoc.ref.collection("pages").get();

    for (const pageDoc of pagesSnapshot.docs) {
      const segmentsSnapshot = await pageDoc.ref.collection("segments").get();

      for (const segmentDoc of segmentsSnapshot.docs) {
        const legacyVersionsSnapshot = await segmentDoc.ref
          .collection("versions")
          .get();

        if (legacyVersionsSnapshot.empty) {
          continue;
        }

        let batch = db.batch();
        let batchOps = 0;

        const commitBatch = async () => {
          if (batchOps === 0) return;
          if (!dryRun) {
            await batch.commit();
          }
          batches += 1;
          batch = db.batch();
          batchOps = 0;
        };

        for (const versionDoc of legacyVersionsSnapshot.docs) {
          const legacyData = versionDoc.data() || {};
          const targetRef = segmentDoc.ref
            .collection("scriptVersions")
            .doc(versionDoc.id);
          const existing = await targetRef.get();

          if (existing.exists) {
            skipped += 1;
            continue;
          }

          const payload = {
            ...legacyData,
            id: legacyData.id || versionDoc.id,
            segmentId: legacyData.segmentId || segmentDoc.id,
          };

          if (!dryRun) {
            batch.set(targetRef, payload, { merge: true });
            batchOps += 1;
          }
          migrated += 1;

          if (deleteOld) {
            if (!dryRun) {
              batch.delete(versionDoc.ref);
              batchOps += 1;
            }
            deleted += 1;
          }

          if (batchOps >= 400) {
            await commitBatch();
          }
        }

        await commitBatch();
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        deleteOld,
        migrated,
        skipped,
        deleted,
        batches,
      },
      null,
      2,
    ),
  );
}

migrate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
