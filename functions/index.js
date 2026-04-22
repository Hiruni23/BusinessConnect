const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
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

/* =====================================================
   4️⃣ Create Stripe Connect Express Account
===================================================== */
exports.createConnectAccount = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  try {
    const db = admin.firestore();
    const userDocRef = db.collection("users").doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userData = userSnap.data();

    if (userData.stripeAccountId) {
      return { accountId: userData.stripeAccountId };
    }

    // Create a new Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // Or dynamic based on user setup
      email: request.auth.token.email || userData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await userDocRef.update({
      stripeAccountId: account.id
    });

    return { accountId: account.id };
  } catch (error) {
    console.error("Error creating connect account: ", error);
    throw new HttpsError("internal", error.message);
  }
});

/* =====================================================
   5️⃣ Get Stripe Connect Onboarding Link
===================================================== */
exports.createConnectAccountLink = onCall(async (request) => {
  const uid = request.auth?.uid;
  const { accountId } = request.data;

  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!accountId) {
    throw new HttpsError("invalid-argument", "Valid account ID must be provided.");
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'https://us-central1-businessconnect-b6310.cloudfunctions.net/stripeRedirect',
      return_url: 'https://us-central1-businessconnect-b6310.cloudfunctions.net/stripeRedirect?status=success',
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  } catch (error) {
    console.error("Error creating account link: ", error);
    throw new HttpsError("internal", error.message);
  }
});

/* =====================================================
   6️⃣ Fetch Connect Account Balance
===================================================== */
exports.getConnectBalance = onCall(async (request) => {
  const { accountId } = request.data;

  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  try {
    const balance = await stripe.balance.retrieve({}, {
      stripeAccount: accountId,
    });
    return { balance };
  } catch (error) {
    console.error("Error retrieving balance: ", error);
    throw new HttpsError("internal", error.message);
  }
});

/* =====================================================
   7️⃣ Process Payout
===================================================== */
exports.processConnectPayout = onCall(async (request) => {
  const { accountId, amount } = request.data; // amount in cents

  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  try {
    const payout = await stripe.payouts.create({
      amount: amount,
      currency: "usd",
    }, {
      stripeAccount: accountId,
    });
    return { payout };
  } catch (error) {
    console.error("Error processing payout: ", error);
    throw new HttpsError("internal", error.message);
  }
});

/* =====================================================
   8️⃣ Stripe Connect Redirect
===================================================== */
exports.stripeRedirect = onRequest((req, res) => {
  const status = req.query.status || 'refresh';
  res.redirect(`businessconnect://entrepreneur/payouts?status=${status}`);
});