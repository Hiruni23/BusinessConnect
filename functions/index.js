const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const templates = require("./emailTemplates");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Stripe = require("stripe");
const { defineSecret } = require("firebase-functions/params");

admin.initializeApp();

// Load secrets from environment first, then Firebase Functions config.
function getFirebaseConfigValue(configPath) {
  try {
    const parts = configPath.split(".");
    let config = require("firebase-functions").config();
    for (const part of parts) {
      config = config?.[part];
      if (!config) return "";
    }
    return String(config);
  } catch (error) {
    return "";
  }
}

function getSecret(envVar, configPath) {
  return process.env[envVar] || getFirebaseConfigValue(configPath) || "";
}

const stripeSecret = getSecret("STRIPE_SECRET_KEY", "stripe.secret_key");
const webhookSecret = getSecret("STRIPE_WEBHOOK_SECRET", "stripe.webhook_secret");
const geminiKeyEnv = getSecret("GEMINI_API_KEY", "gemini.api_key");
const emailUser = getSecret("EMAIL_USER", "email.user");
const emailPass = getSecret("EMAIL_PASS", "email.pass");

const stripeSecretParam = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecretParam = defineSecret("STRIPE_WEBHOOK_SECRET");

if (!stripeSecret) {
  console.warn("STRIPE_SECRET_KEY not configured. Set via .env (local) or `firebase functions:config:set stripe.secret_key=...` (production)");
}

function getStripeClient() {
  const secret = stripeSecretParam.value() || stripeSecret;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(secret);
}

// Initialize Gemini AI
const rawKey = geminiKeyEnv || "YOUR_GEMINI_API_KEY";
const cleanKey = rawKey.replace(/^["']|["']$/g, '');
const genAI = new GoogleGenerativeAI(cleanKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/* =====================================================
   0️⃣ Business AI Suite (Centralized AI Functions)
===================================================== */

// A. Chat Assistant
exports.askBusinessAI = onCall(async (request) => {
  const { prompt, pitchData } = request.data;
  if (!prompt) throw new HttpsError("invalid-argument", "Prompt is required.");

  try {
    let context = "You are a senior business consultant. ";
    if (pitchData) {
      context += `\nContext: ${pitchData.title} - ${pitchData.description}\n`;
    }
    const result = await model.generateContent(`${context}\nUser: ${prompt}`);
    return { text: result.response.text() };
  } catch (error) {
    console.error("askBusinessAI error:", error);
    throw new HttpsError("internal", "AI Service Error: " + error.message);
  }
});

// B. Pitch Generator
exports.generateAIPitch = onCall(async (request) => {
  const { keywords } = request.data;
  if (!keywords) throw new HttpsError("invalid-argument", "Keywords required.");

  try {
    const prompt = `Write a professional 3-paragraph investor pitch for: ${keywords}`;
    const result = await model.generateContent(prompt);
    return { text: result.response.text() };
  } catch (error) {
    console.error("generateAIPitch error:", error);
    throw new HttpsError("internal", "AI Generation Error.");
  }
});

// C. Pitch Analyzer (Grader)
exports.analyzePitch = onCall(async (request) => {
  const { title, description, category } = request.data;
  try {
    const prompt = `Act as a VC. Analyze this pitch: ${title}\nCategory: ${category}\nDesc: ${description}\nReturn JSON: {score: 0-100, feedback: [], verdict: ""}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("analyzePitch error:", error);
    throw new HttpsError("internal", "AI Analysis Error.");
  }
});

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
exports.createPaymentIntent = onCall({ secrets: [stripeSecretParam] }, async (request) => {
  const { amount, currency } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  if (!amount || amount <= 0) {
    throw new HttpsError("invalid-argument", "Valid amount must be provided.");
  }

  try {
    const stripe = getStripeClient();
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
exports.createConnectAccount = onCall({ secrets: [stripeSecretParam] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "You must be logged in.");

  try {
    const stripe = getStripeClient();
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
exports.createConnectAccountLink = onCall({ secrets: [stripeSecretParam] }, async (request) => {
  const { accountId } = request.data;
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "You must be logged in.");

  try {
    const stripe = getStripeClient();
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
exports.getConnectBalance = onCall({ secrets: [stripeSecretParam] }, async (request) => {
  const { accountId } = request.data;
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "You must be logged in.");

  try {
    const stripe = getStripeClient();
    const balance = await stripe.balance.retrieve({}, { stripeAccount: accountId });
    return { balance };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

/* =====================================================
   7️⃣ Process Payout
===================================================== */
exports.processConnectPayout = onCall({ secrets: [stripeSecretParam] }, async (request) => {
  const { accountId, amount } = request.data;
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "You must be logged in.");

  const amountDollars = Number(amount) / 100;
  if (!amountDollars || amountDollars <= 0) {
    throw new HttpsError("invalid-argument", "A valid payout amount is required.");
  }

  try {
    const db = admin.firestore();
    const walletRef = db.collection("wallets").doc(uid);
    const payoutRef = db.collection("payouts").doc();

    let walletBalance = 0;

    await db.runTransaction(async (transaction) => {
      const walletSnap = await transaction.get(walletRef);
      if (!walletSnap.exists) {
        throw new HttpsError("failed-precondition", "Wallet not found.");
      }

      walletBalance = Number(walletSnap.data().balance || 0);
      if (walletBalance < amountDollars) {
        throw new HttpsError("failed-precondition", "Insufficient wallet balance.");
      }

      transaction.update(walletRef, {
        balance: walletBalance - amountDollars,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.set(payoutRef, {
        userId: uid,
        accountId: accountId || null,
        amount: amountDollars,
        currency: "usd",
        status: "processing",
        source: "wallet",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        bankLast4: "Bank",
      });
    });

    let stripePayout = null;
    try {
      if (accountId) {
        const stripe = getStripeClient();
        stripePayout = await stripe.payouts.create({ amount, currency: "usd" }, { stripeAccount: accountId });

        await payoutRef.set(
          {
            status: stripePayout.status || "paid",
            stripePayoutId: stripePayout.id,
            arrivalDate: stripePayout.arrival_date ? new Date(stripePayout.arrival_date * 1000) : null,
          },
          { merge: true }
        );
      } else {
        await payoutRef.set({ status: "queued" }, { merge: true });
      }
    } catch (stripeError) {
      await payoutRef.set(
        {
          status: "queued",
          lastError: stripeError.message,
        },
        { merge: true }
      );
    }

    return { success: true, payoutId: payoutRef.id, stripePayout };
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

  /* =====================================================
     11️⃣ Fund Connected Account On Release
     Callable by admins to transfer platform funds into a Connect account
     This will create a Stripe Transfer and record it in `transfers`.
  ===================================================== */
  exports.fundConnectAccount = onCall({ secrets: [stripeSecretParam] }, async (request) => {
    const { targetUserId, amountCents, idempotencyKey, investmentId } = request.data;
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "You must be logged in.");

    const db = admin.firestore();

    // Only allow admin callers to invoke this
    const callerSnap = await db.collection('users').doc(uid).get();
    if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can call this function.');
    }

    if (!targetUserId || !amountCents) {
      throw new HttpsError('invalid-argument', 'targetUserId and amountCents are required.');
    }

    const userSnap = await db.collection('users').doc(targetUserId).get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Target user not found.');
    }

    const accountId = userSnap.data().stripeAccountId;
    if (!accountId) {
      throw new HttpsError('failed-precondition', 'Target user does not have a connected Stripe account.');
    }

    try {
      const stripe = getStripeClient();
      const transfer = await stripe.transfers.create(
        { amount: amountCents, currency: 'usd', destination: accountId },
        { idempotencyKey: idempotencyKey || `release-${investmentId || Date.now()}` }
      );

      const transferRef = db.collection('transfers').doc(transfer.id);
      await transferRef.set({
        id: transfer.id,
        userId: targetUserId,
        amount: amountCents / 100,
        currency: 'usd',
        status: transfer.status,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        stripeResponse: transfer,
        investmentId: investmentId || null
      });

      return { success: true, transferId: transfer.id };
    } catch (err) {
      // Record a failed transfer attempt for later reconciliation
      const recordRef = db.collection('transfers').doc();
      await recordRef.set({
        userId: targetUserId,
        amount: amountCents / 100,
        currency: 'usd',
        status: 'failed',
        error: err.message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        idempotencyKey: idempotencyKey || null,
        investmentId: investmentId || null
      });

      console.error('Transfer error:', err);
      throw new HttpsError('internal', err.message);
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
    user: emailUser || "placeholder@gmail.com",
    pass: emailPass || "placeholder_pass",
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

/* =====================================================
   🔟 Stripe Webhook for Real-Time Payouts
===================================================== */
exports.stripeWebhook = onRequest({ secrets: [stripeSecretParam, stripeWebhookSecretParam] }, async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const stripe = getStripeClient();

  const webhookSecretValue = stripeWebhookSecretParam.value() || webhookSecret;
  if (!webhookSecretValue) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return res.status(500).send("Webhook secret is not configured.");
  }

  if (!signature) {
    return res.status(400).send("Missing Stripe signature header.");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      webhookSecretValue
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const db = admin.firestore();
    const type = event.type;
    const data = event.data.object;

    if (type === "payout.created" || type === "payout.paid" || type === "payout.failed") {
      const accountId = event.account; // Stripe Connect account ID if applicable
      const payoutStatus = data.status; // 'pending', 'paid', 'failed', 'canceled'
      const amount = data.amount / 100;

      // We need to find the user with this stripeAccountId
      const usersSnap = await db.collection("users").where("stripeAccountId", "==", accountId).limit(1).get();

      if (!usersSnap.empty) {
        const userId = usersSnap.docs[0].id;

        // Update or create a payout record
        const payoutRef = db.collection("payouts").doc(data.id);
        await payoutRef.set({
          id: data.id,
          userId: userId,
          amount: amount,
          status: payoutStatus,
          currency: data.currency,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          arrivalDate: data.arrival_date ? new Date(data.arrival_date * 1000) : null,
          bankLast4: data.destination ? "Bank" : "Card"
        }, { merge: true });

        console.log(`Updated payout ${data.id} to status ${payoutStatus} for user ${userId}`);
      }
    } else if (type === "payment_intent.succeeded") {
      console.log("Payment Intent Succeeded:", data.id);
    }

    res.status(200).send({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});