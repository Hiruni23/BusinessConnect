const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const stripe = require("stripe")("sk_test_51TOKSuCDZMl8sA2g91wKmQS6m18tHCQKcb2NV3Iy7kI9maTwb8NzJsDFiy8uROS4aGoV76USDPG1IuSPJ2iVRv6b00keVElovj");


admin.initializeApp();

/* =====================================================
   1️⃣ Notify Investors When Pitch Is Created
===================================================== */

exports.notifyInvestorsOnPitch = onDocumentCreated(
  "pitches/{pitchId}",
  async (event) => {
    const pitch = event.data.data();
    const db = admin.firestore();

    // Get all investors
    const investorsSnap = await db
      .collection("users")
      .where("role", "==", "investor")
      .get();

    if (investorsSnap.empty) return;

    const batch = db.batch();

    investorsSnap.forEach((doc) => {
      const notificationRef = db.collection("notifications").doc();

      batch.set(notificationRef, {
        userId: doc.id,
        pitchId: event.params.pitchId,
        message: `New pitch submitted: ${pitch.title}`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    console.log("Investors notified.");
  }
);

/* =====================================================
   2️⃣ Notify Entrepreneur When Status Changes
===================================================== */

exports.notifyEntrepreneurOnUpdate = onDocumentUpdated(
  "pitches/{pitchId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Only trigger if status changed
    if (before.status === after.status) return;

    const db = admin.firestore();

    await db.collection("notifications").add({
      userId: after.userId, // Entrepreneur ID
      pitchId: event.params.pitchId,
      message: `Your pitch "${after.title}" was ${after.status}`,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Entrepreneur notified.");
  }
);

/* =====================================================
   3️⃣ Create Stripe Payment Intent for Investments
===================================================== */
exports.createPaymentIntent = onCall(async (request) => {
  const { amount, currency } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!amount || amount <= 0) {
    throw new HttpsError("invalid-argument", "Valid amount must be provided.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency || "usd",
      metadata: { uid },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Stripe Error:", error);
    throw new HttpsError("internal", "Unable to create payment intent.");
  }
});