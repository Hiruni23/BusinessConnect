const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const templates = require("./emailTemplates");
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

    if (before.status === after.status) return;

    const db = admin.firestore();

    await db.collection("notifications").add({
      userId: after.entrepreneurId || after.userId,
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

    return { clientSecret: paymentIntent.client_secret };
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
  if (!uid) throw new HttpsError("unauthenticated", "You must be logged in.");

  try {
    const db = admin.firestore();
    const userDocRef = db.collection("users").doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) throw new HttpsError("not-found", "User not found");
    const userData = userSnap.data();

    if (userData.stripeAccountId) return { accountId: userData.stripeAccountId };

    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: request.auth.token.email || userData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await userDocRef.update({ stripeAccountId: account.id });
    return { accountId: account.id };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

/* =====================================================
   5️⃣ Get Stripe Connect Onboarding Link
===================================================== */
exports.createConnectAccountLink = onCall(async (request) => {
  const { accountId } = request.data;
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "You must be logged in.");

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'https://us-central1-businessconnect-b6310.cloudfunctions.net/stripeRedirect',
      return_url: 'https://us-central1-businessconnect-b6310.cloudfunctions.net/stripeRedirect?status=success',
      type: 'account_onboarding',
    });
    return { url: accountLink.url };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

/* =====================================================
   6️⃣ Fetch Connect Account Balance
===================================================== */
exports.getConnectBalance = onCall(async (request) => {
  const { accountId } = request.data;
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "You must be logged in.");

  try {
    const balance = await stripe.balance.retrieve({}, { stripeAccount: accountId });
    return { balance };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

/* =====================================================
   7️⃣ Process Payout
===================================================== */
exports.processConnectPayout = onCall(async (request) => {
  const { accountId, amount } = request.data;
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "You must be logged in.");

  try {
    const payout = await stripe.payouts.create({ amount, currency: "usd" }, { stripeAccount: accountId });
    return { payout };
  } catch (error) {
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

/* =====================================================
   9️⃣ Automated Email Governance System
===================================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "placeholder@gmail.com",
    pass: process.env.EMAIL_PASS || "placeholder_pass",
  },
});

/**
 * 📊 WEEKLY MARKET PULSE
 * Runs every Monday at 9:00 AM
 */
exports.weeklyMarketPulse = onSchedule("every monday 09:00", async (event) => {
  const db = admin.firestore();
  
  const pitchesSnap = await db.collection("pitches").get();
  const milestonesSnap = await db.collection("milestones").where("status", "==", "completed").get();
  
  const stats = {
    activeProjects: pitchesSnap.size,
    pendingMilestones: milestonesSnap.size,
    totalCapital: pitchesSnap.docs.reduce((acc, doc) => acc + (doc.data().raisedAmount || 0), 0),
    newPitches: pitchesSnap.docs.filter(d => {
        const data = d.data();
        const created = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
    }).length
  };

  const stakeholdersSnap = await db.collection("users").where("role", "==", "Stakeholder").get();
  
  const mailPromises = stakeholdersSnap.docs.map(doc => {
    const user = doc.data();
    if (!user.email) return Promise.resolve();

    return transporter.sendMail({
      from: '"BusinessConnect Oversight" <no-reply@businessconnect.app>',
      to: user.email,
      subject: "Your Weekly Market Pulse Report",
      html: templates.weeklyPulse(stats),
    });
  });

  await Promise.allSettled(mailPromises);
  console.log("Weekly Pulse execution complete.");
});

/**
 * 🔔 INSTANT MILESTONE ALERT
 * Triggered when a milestone is completed by an entrepreneur
 */
exports.onMilestoneCompletedEmail = onDocumentCreated(
  "milestones/{id}",
  async (event) => {
    const milestone = event.data.data();
    if (milestone.status !== "completed") return;

    const db = admin.firestore();
    const stakeholdersSnap = await db.collection("users").where("role", "==", "Stakeholder").get();

    const mailPromises = stakeholdersSnap.docs.map(doc => {
      const user = doc.data();
      return transporter.sendMail({
        from: '"Governance Alert" <no-reply@businessconnect.app>',
        to: user.email,
        subject: `Review Required: ${milestone.pitchTitle}`,
        html: templates.milestoneAlert({
            type: 'completed',
            pitchTitle: milestone.pitchTitle,
            milestoneTitle: milestone.title,
            status: 'Pending Review',
            description: milestone.description
        }),
      });
    });

    await Promise.allSettled(mailPromises);
  }
);

/**
 * 📝 GOVERNANCE DECISION EMAIL
 * Triggered when a stakeholder approves/rejects a milestone
 */
exports.onMilestoneStatusChangeEmail = onDocumentUpdated(
  "milestones/{id}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === after.status) return;
    if (after.status === "completed") return; 

    const db = admin.firestore();
    const entrepreneurDoc = await db.collection("users").doc(after.entrepreneurId).get();
    const entrepreneur = entrepreneurDoc.data();

    if (!entrepreneur?.email) return;

    await transporter.sendMail({
      from: '"Governance Board" <no-reply@businessconnect.app>',
      to: entrepreneur.email,
      subject: `Milestone ${after.status.toUpperCase()}: ${after.pitchTitle}`,
      html: templates.milestoneAlert({
          type: 'decision',
          pitchTitle: after.pitchTitle,
          milestoneTitle: after.title,
          status: after.status,
          description: after.feedback || "Your milestone has been reviewed by the stakeholder board."
      }),
    });
  }
);