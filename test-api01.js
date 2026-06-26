/**
 * Obstakl Property Rental & Booking Platform - API Test Script
 * ---------------------------------------------------------------
 * Requires Node 18+ (uses built-in fetch). Run with: node test-api.js
 *
 * What this does:
 *   Walks through the full Tenant + Owner flow against your locally
 *   running server, printing PASS/FAIL for every endpoint along the way.
 *   Admin endpoints are in a separate section, gated behind env vars
 *   (see CONFIG below) since you can't self-register as Admin.
 *
 * Notes:
 *   - Uses a timestamp suffix on emails so re-running doesn't collide
 *     with "user already exists" errors.
 *   - Cleans up the property + review + favorite it creates at the end.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:5000/api";

// Set these if you already have a seeded Admin account to test /admin/* routes
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const RUN_ID = Date.now();
const TENANT = {
  name: "Test Tenant",
  email: `tenant.${RUN_ID}@example.com`,
  photo: "https://example.com/avatar1.jpg",
  password: "TestPass123!",
  role: "Tenant",
};
const OWNER = {
  name: "Test Owner",
  email: `owner.${RUN_ID}@example.com`,
  photo: "https://example.com/avatar2.jpg",
  password: "TestPass123!",
  role: "Owner",
};

const results = [];
let passCount = 0;
let failCount = 0;

function logResult(name, ok, status, extra = "") {
  if (ok) passCount++;
  else failCount++;
  results.push({ name, ok, status, extra });
  const icon = ok ? "\x1b[32m✅ PASS\x1b[0m" : "\x1b[31m❌ FAIL\x1b[0m";
  console.log(`${icon}  [${status}]  ${name}${extra ? "  -> " + extra : ""}`);
}

async function call(method, path, { body, token, expectStatus } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res, data, text;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      text = await res.text();
      data = { rawText: text.slice(0, 200) };
    }
  } catch (err) {
    return { ok: false, status: 0, data: { error: err.message }, networkError: true };
  }

  const ok = expectStatus ? res.status === expectStatus : res.ok;
  return { ok, status: res.status, data, networkError: false };
}

async function step(name, fn) {
  try {
    return await fn();
  } catch (err) {
    logResult(name, false, "ERR", err.message);
    return null;
  }
}

async function main() {
  console.log(`\nTesting API at ${BASE_URL}\n${"=".repeat(60)}\n`);

  // ---------- 1. AUTH ----------
  console.log("\n--- Auth & Session ---");

  const regTenant = await call("POST", "/auth/register", { body: TENANT });
  logResult("Register Tenant", regTenant.ok, regTenant.status, regTenant.ok ? "" : JSON.stringify(regTenant.data));
  let tenantToken = regTenant.data?.data?.token;

  const regOwner = await call("POST", "/auth/register", { body: OWNER });
  logResult("Register Owner", regOwner.ok, regOwner.status, regOwner.ok ? "" : JSON.stringify(regOwner.data));
  let ownerToken = regOwner.data?.data?.token;

  const loginTenant = await call("POST", "/auth/login", {
    body: { email: TENANT.email, password: TENANT.password },
  });
  logResult("Login Tenant", loginTenant.ok, loginTenant.status);
  if (loginTenant.data?.data?.token) tenantToken = loginTenant.data.data.token;

  const meTenant = await call("GET", "/auth/me", { token: tenantToken });
  logResult("Get Current User (/auth/me)", meTenant.ok, meTenant.status);

  const socialLogin = await call("POST", "/auth/social-login", {
    body: { name: "Google User", email: `social.${RUN_ID}@example.com`, photo: "https://example.com/g.jpg" },
  });
  logResult("Social Login", socialLogin.ok, socialLogin.status);

  const logout = await call("POST", "/auth/logout", {});
  logResult("Logout", logout.ok, logout.status);

  if (!tenantToken || !ownerToken) {
    console.log("\n⚠️  Could not obtain tokens for Tenant/Owner — stopping further tests.");
    printSummary();
    return;
  }

  // Log in as Admin early (if creds provided) so we can approve the test
  // property before running booking/favorite tests against it.
  let adminToken = null;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const adminLoginEarly = await call("POST", "/auth/login", {
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    logResult("Admin Login", adminLoginEarly.ok, adminLoginEarly.status);
    adminToken = adminLoginEarly.data?.data?.token;
  } else {
    console.log("⚠️  No ADMIN_EMAIL/ADMIN_PASSWORD set — property will stay Pending, so booking/favorites tests will correctly fail with 400. Set admin creds to test the full happy path.");
  }

  // ---------- 2. PROPERTIES ----------
  console.log("\n--- Properties ---");

  const propertiesList = await call("GET", "/properties");
  logResult("Get Properties (public, no filters)", propertiesList.ok, propertiesList.status);

  const propertiesFiltered = await call("GET", "/properties?location=New&minPrice=100&maxPrice=10000&sort=priceAsc&page=1&limit=5");
  logResult("Get Properties (filtered/sorted/paginated)", propertiesFiltered.ok, propertiesFiltered.status);

  const featured = await call("GET", "/properties/featured");
  logResult("Get Featured Properties", featured.ok, featured.status);

  const newProperty = {
    title: `Test Property ${RUN_ID}`,
    description: "Automated test listing - safe to delete.",
    location: "Test City, Testland",
    propertyType: "Apartment",
    rent: 1200,
    rentType: "Monthly",
    bedrooms: 2,
    bathrooms: 1,
    propertySize: 850,
    amenities: ["Wifi", "Parking"],
    images: ["https://example.com/test.jpg"],
    extraFeatures: { pets: false },
  };

  const createProperty = await call("POST", "/properties", { body: newProperty, token: ownerToken });
  logResult("Add Property (Owner)", createProperty.ok, createProperty.status, createProperty.ok ? "" : JSON.stringify(createProperty.data));
  const propertyId = createProperty.data?.data?._id;

  const createPropertyAsTenant = await call("POST", "/properties", { body: newProperty, token: tenantToken });
  logResult("Add Property as Tenant (should be blocked, expect 403)", createPropertyAsTenant.status === 403, createPropertyAsTenant.status);

  if (propertyId && adminToken) {
    const approveProperty = await call("PATCH", `/admin/properties/${propertyId}/status`, {
      body: { status: "Approved" },
      token: adminToken,
    });
    logResult("Approve Test Property (Admin)", approveProperty.ok, approveProperty.status, approveProperty.ok ? "" : JSON.stringify(approveProperty.data));
  } else if (propertyId && !adminToken) {
    console.log("⚠️  Skipping property approval — no admin token. Booking/favorites tests below will fail with 400 as expected for a Pending property.");
  }

  const myListings = await call("GET", "/properties/my-listings", { token: ownerToken });
  logResult("Get Owner's Listings", myListings.ok, myListings.status);

  if (propertyId) {
    const getById = await call("GET", `/properties/${propertyId}`, { token: tenantToken });
    logResult("Get Property by ID", getById.ok, getById.status);

    const updateProperty = await call("PUT", `/properties/${propertyId}`, {
      body: { rent: 1300 },
      token: ownerToken,
    });
    logResult("Update Property (Owner)", updateProperty.ok, updateProperty.status);
  } else {
    console.log("⚠️  No propertyId — skipping property-dependent tests (get by id, update, bookings, reviews, favorites).");
  }

  // ---------- 3. BOOKINGS & PAYMENTS ----------
  console.log("\n--- Bookings & Payments ---");

  // Sanity check: does /bookings/confirm enforce the same "must be Approved"
  // rule that /bookings/create-payment-intent does? We test this on a SEPARATE
  // property that is deliberately left Pending (never approved), so the result
  // isn't muddied by the main property (which we just approved above).
  let pendingPropertyId = null;
  {
    const pendingProp = await call("POST", "/properties", {
      body: { ...newProperty, title: `Pending Test Property ${RUN_ID}` },
      token: ownerToken,
    });
    pendingPropertyId = pendingProp.data?.data?._id;
  }

  if (pendingPropertyId) {
    const confirmOnPending = await call("POST", "/bookings/confirm", {
      body: {
        propertyId: pendingPropertyId,
        moveInDate: "2026-08-01T00:00:00.000Z",
        contactNumber: "+1234567890",
        additionalNotes: "Security check - booking a non-approved property directly.",
        transactionId: `ch_securitycheck_${RUN_ID}`,
        amountPaid: newProperty.rent,
      },
      token: tenantToken,
    });
    const blockedCorrectly = confirmOnPending.status === 400;
    logResult(
      "Security check: /bookings/confirm rejects non-approved property",
      blockedCorrectly,
      confirmOnPending.status,
      blockedCorrectly ? "" : "⚠️ confirm-booking allowed booking a Pending property directly — missing approval check"
    );
    // cleanup the throwaway pending property
    await call("DELETE", `/properties/${pendingPropertyId}`, { token: ownerToken });
  }

  let bookingId = null;

  if (propertyId) {
    const paymentIntent = await call("POST", "/bookings/create-payment-intent", {
      body: { propertyId },
      token: tenantToken,
    });
    logResult("Create Payment Intent", paymentIntent.ok, paymentIntent.status, paymentIntent.ok ? "" : JSON.stringify(paymentIntent.data));

    const paymentIntentId = paymentIntent.data?.data?.paymentIntentId;

    const confirmBooking = await call("POST", "/bookings/confirm", {
      body: {
        propertyId,
        moveInDate: "2026-08-01T00:00:00.000Z",
        contactNumber: "+1234567890",
        additionalNotes: "Automated test booking.",
        transactionId: paymentIntentId || `ch_test_${RUN_ID}`,
        amountPaid: newProperty.rent,
      },
      token: tenantToken,
    });
    logResult(
      "Confirm Booking & Save Transaction",
      confirmBooking.ok,
      confirmBooking.status,
      confirmBooking.ok ? "" : JSON.stringify(confirmBooking.data)
    );
    bookingId = confirmBooking.data?.data?._id;
    if (!confirmBooking.ok) {
      console.log("   ↳ If this failed with a Stripe-related error, your /bookings/confirm endpoint likely verifies transactionId against Stripe directly. Let me know and I'll adjust the script to do a real Stripe test-mode charge first.");
    }
  } else {
    console.log("⚠️  Skipping booking tests — no propertyId available.");
  }

  const myBookings = await call("GET", "/bookings/my-bookings", { token: tenantToken });
  logResult("Get My Bookings (Tenant)", myBookings.ok, myBookings.status);

  const bookingRequests = await call("GET", "/bookings/requests", { token: ownerToken });
  logResult("Get Booking Requests (Owner)", bookingRequests.ok, bookingRequests.status);

  if (bookingId) {
    const approveBooking = await call("PATCH", `/bookings/${bookingId}/status`, {
      body: { status: "Approved" },
      token: ownerToken,
    });
    logResult("Approve Booking (Owner)", approveBooking.ok, approveBooking.status);
  }

  const ownerAnalytics = await call("GET", "/bookings/owner-analytics", { token: ownerToken });
  logResult("Get Owner Analytics", ownerAnalytics.ok, ownerAnalytics.status);

  const ownerReport = await call("GET", "/bookings/owner-report", { token: ownerToken });
  logResult(
    "Download Owner Earnings Report (PDF)",
    ownerReport.ok,
    ownerReport.status,
    ownerReport.data?.rawText ? "(binary/PDF response received)" : ""
  );

  // ---------- 4. REVIEWS ----------
  console.log("\n--- Reviews ---");

  let reviewId = null;
  if (propertyId) {
    const addReview = await call("POST", "/reviews", {
      body: { propertyId, rating: 5, comment: "Automated test review - safe to delete." },
      token: tenantToken,
    });
    logResult("Add Review (Tenant)", addReview.ok, addReview.status, addReview.ok ? "" : JSON.stringify(addReview.data));
    reviewId = addReview.data?.data?._id;

    const getReviews = await call("GET", `/reviews/property/${propertyId}`);
    logResult("Get Property Reviews (public)", getReviews.ok, getReviews.status);

    if (reviewId) {
      const deleteReview = await call("DELETE", `/reviews/${reviewId}`, { token: tenantToken });
      logResult("Delete Review", deleteReview.ok, deleteReview.status);
    }
  } else {
    console.log("⚠️  Skipping review tests — no propertyId available.");
  }

  // ---------- 5. FAVORITES ----------
  console.log("\n--- Favorites ---");

  if (propertyId) {
    const addFavorite = await call("POST", "/favorites", { body: { propertyId }, token: tenantToken });
    logResult("Add to Favorites", addFavorite.ok, addFavorite.status, addFavorite.ok ? "" : JSON.stringify(addFavorite.data));

    const getFavorites = await call("GET", "/favorites", { token: tenantToken });
    logResult("Get Favorites List", getFavorites.ok, getFavorites.status);

    const removeFavorite = await call("DELETE", `/favorites/${propertyId}`, { token: tenantToken });
    logResult("Remove from Favorites", removeFavorite.ok, removeFavorite.status);
  } else {
    console.log("⚠️  Skipping favorites tests — no propertyId available.");
  }

  // ---------- 6. CLEANUP ----------
  console.log("\n--- Cleanup ---");
  if (propertyId) {
    const deleteProperty = await call("DELETE", `/properties/${propertyId}`, { token: ownerToken });
    logResult("Delete Test Property (Owner)", deleteProperty.ok, deleteProperty.status);
  }

  // ---------- 7. ADMIN (only if credentials provided) ----------
  console.log("\n--- Admin (gated) ---");
  if (!adminToken) {
    console.log("⚠️  Skipped — set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests.");
    console.log("   Example: ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=secret node test-api.js");
  } else {
    {
      const allUsers = await call("GET", "/admin/users", { token: adminToken });
      logResult("Get All Users", allUsers.ok, allUsers.status);

      const allProps = await call("GET", "/admin/properties", { token: adminToken });
      logResult("Get All Properties (moderation)", allProps.ok, allProps.status);

      const adminStats = await call("GET", "/admin/stats", { token: adminToken });
      logResult("Get Admin Dashboard Stats", adminStats.ok, adminStats.status);

      const allBookings = await call("GET", "/bookings/all", { token: adminToken });
      logResult("Get All Bookings (Admin)", allBookings.ok, allBookings.status);

      const allTransactions = await call("GET", "/bookings/transactions", { token: adminToken });
      logResult("Get All Transactions (Admin)", allTransactions.ok, allTransactions.status);

      // Change role test on the tenant we created
      const meTenantData = await call("GET", "/auth/me", { token: tenantToken });
      const tenantId = meTenantData.data?.data?.user?.id;
      if (tenantId) {
        const changeRole = await call("PATCH", `/admin/users/${tenantId}/role`, {
          body: { role: "Owner" },
          token: adminToken,
        });
        logResult("Change User Role (Admin)", changeRole.ok, changeRole.status);
      }
    }
  }

  printSummary();
}

function printSummary() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  if (failCount > 0) {
    console.log("\nFailed checks:");
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - [${r.status}] ${r.name} ${r.extra}`));
  }
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error running tests:", err);
  process.exit(1);
});
