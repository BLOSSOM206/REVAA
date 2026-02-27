/* eslint-disable no-console */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    apply: args.has("--apply"),
    deleteOldUsers: args.has("--delete-old-users"),
  };
}

async function listAllAuthUsers() {
  const byUid = new Map();
  const byEmail = new Map();
  let nextPageToken;

  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    for (const user of result.users) {
      byUid.set(user.uid, user);
      if (user.email) {
        byEmail.set(user.email.toLowerCase(), user.uid);
      }
    }
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  return {byUid, byEmail};
}

function inferTargetUid({docId, data, authByUid, authByEmail}) {
  if (authByUid.has(docId)) {
    return docId;
  }

  if (typeof data.uid === "string" && authByUid.has(data.uid)) {
    return data.uid;
  }

  if (typeof data.email === "string") {
    const byEmail = authByEmail.get(data.email.toLowerCase());
    if (byEmail) {
      return byEmail;
    }
  }

  return null;
}

async function migrateUsers({apply, deleteOldUsers}) {
  const usersSnap = await db.collection("users").get();
  const {byUid, byEmail} = await listAllAuthUsers();
  const legacyIdToUid = new Map();
  let fixed = 0;
  let unresolved = 0;

  for (const userDoc of usersSnap.docs) {
    const docId = userDoc.id;
    const data = userDoc.data() || {};
    const targetUid = inferTargetUid({
      docId,
      data,
      authByUid: byUid,
      authByEmail: byEmail,
    });

    if (!targetUid) {
      unresolved += 1;
      console.log(`[UNRESOLVED USER] ${docId} email=${data.email || "n/a"}`);
      continue;
    }

    legacyIdToUid.set(docId, targetUid);

    if (docId === targetUid) {
      continue;
    }

    fixed += 1;
    console.log(`[USER FIX] ${docId} -> ${targetUid}`);

    if (apply) {
      await db.collection("users").doc(targetUid).set(
          {
            ...data,
            uid: targetUid,
          },
          {merge: true},
      );

      if (deleteOldUsers) {
        await db.collection("users").doc(docId).delete();
      }
    }
  }

  return {legacyIdToUid, fixed, unresolved};
}

async function migrateCourses({apply, legacyIdToUid}) {
  const coursesSnap = await db.collection("courses").get();
  let changed = 0;
  let unchanged = 0;

  for (const courseDoc of coursesSnap.docs) {
    const data = courseDoc.data() || {};
    const professors = Array.isArray(data.professors) ? data.professors : [];

    const mapped = professors.map((value) => {
      if (typeof value !== "string") return value;
      return legacyIdToUid.get(value) || value;
    });

    const uniqueMapped = [...new Set(mapped)];
    const isSame = JSON.stringify(uniqueMapped) === JSON.stringify(professors);
    if (isSame) {
      unchanged += 1;
      continue;
    }

    changed += 1;
    console.log(
        `[COURSE FIX] ${courseDoc.id}\n` +
      `  before: ${JSON.stringify(professors)}\n` +
      `  after:  ${JSON.stringify(uniqueMapped)}`,
    );

    if (apply) {
      await courseDoc.ref.update({professors: uniqueMapped});
    }
  }

  return {changed, unchanged};
}

async function main() {
  const {apply, deleteOldUsers} = parseArgs(process.argv);
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Delete old user docs: ${deleteOldUsers ? "YES" : "NO"}`);

  const usersResult = await migrateUsers({apply, deleteOldUsers});
  const coursesResult = await migrateCourses({
    apply,
    legacyIdToUid: usersResult.legacyIdToUid,
  });

  console.log("\n=== SUMMARY ===");
  console.log(`Users fixed: ${usersResult.fixed}`);
  console.log(`Users unresolved: ${usersResult.unresolved}`);
  console.log(`Courses changed: ${coursesResult.changed}`);
  console.log(`Courses unchanged: ${coursesResult.unchanged}`);
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
