const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
});

const uid = "ZzVDTeDTCvOKZzlSQ7Qc7Z3MGj32";

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("✅ Admin claim set");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
