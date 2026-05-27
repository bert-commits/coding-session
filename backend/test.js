const BASE = "http://localhost:5000/api/auth";
const uniqueId = () => Math.random().toString(36).slice(2, 8);

let passed = 0;
let failed = 0;

function log(label, ok, detail = "") {
  const icon = ok ? "✓" : "✗";
  console.log(`  ${icon} ${label}${detail ? " — " + detail : ""}`);
  ok ? passed++ : failed++;
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ─── SMOKE TESTS ────────────────────────────────────────────────────────────

async function smokeTests() {
  console.log("\n── Smoke Tests ──────────────────────────────────────────");
  const email = `smoke_${uniqueId()}@test.com`;

  // 1. Register with valid data
  const r1 = await post("/register", { name: "Test User", email, password: "password123" });
  log("Register: valid data returns 201",        r1.status === 201);
  log("Register: response has token",            !!r1.data.token);
  log("Register: response has user object",      !!r1.data.user);
  log("Register: user has name/email/role",      !!(r1.data.user?.name && r1.data.user?.email && r1.data.user?.role));
  log("Register: password not in response",      !r1.data.user?.password);

  // 2. Duplicate email
  const r2 = await post("/register", { name: "Test User", email, password: "password123" });
  log("Register: duplicate email returns 400",   r2.status === 400);
  log("Register: duplicate email has message",   !!r2.data.message);

  // 3. Missing fields
  const r3 = await post("/register", { email: `missing_${uniqueId()}@test.com` });
  log("Register: missing password returns 500",  r3.status === 500);

  const r4 = await post("/register", {});
  log("Register: empty body returns 500",        r4.status === 500);

  // 4. Login with correct credentials
  const l1 = await post("/login", { email, password: "password123" });
  log("Login: correct credentials returns 200",  l1.status === 200);
  log("Login: response has token",               !!l1.data.token);
  log("Login: response has user object",         !!l1.data.user);
  log("Login: password not in response",         !l1.data.user?.password);

  // 5. Login with wrong password
  const l2 = await post("/login", { email, password: "wrongpassword" });
  log("Login: wrong password returns 401",       l2.status === 401);
  log("Login: wrong password has message",       !!l2.data.message);

  // 6. Login with non-existent email
  const l3 = await post("/login", { email: "nobody@nowhere.com", password: "password123" });
  log("Login: unknown email returns 401",        l3.status === 401);

  // 7. Login with empty body
  const l4 = await post("/login", {});
  log("Login: empty body returns 401 or 500",    l4.status === 401 || l4.status === 500);
}

// ─── STRESS TESTS ───────────────────────────────────────────────────────────

async function stressTests() {
  console.log("\n── Stress Tests ─────────────────────────────────────────");
  const CONCURRENT = 20;

  // Concurrent registrations — all unique emails
  console.log(`\n  [Registration] ${CONCURRENT} concurrent unique registrations`);
  const regStart = Date.now();
  const regResults = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, (_, i) =>
      post("/register", {
        name: `User ${i}`,
        email: `stress_${uniqueId()}_${i}@test.com`,
        password: "password123",
      })
    )
  );
  const regMs = Date.now() - regStart;
  const regOk = regResults.filter(r => r.status === "fulfilled" && r.value.status === 201).length;
  log(`All ${CONCURRENT} registrations succeeded`,  regOk === CONCURRENT, `${regMs}ms total, avg ${(regMs/CONCURRENT).toFixed(1)}ms each`);

  // Concurrent duplicate registrations — same email, race condition
  console.log(`\n  [Registration] ${CONCURRENT} concurrent requests with SAME email (race condition)`);
  const dupeEmail = `race_${uniqueId()}@test.com`;
  const dupeResults = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, () =>
      post("/register", { name: "Race User", email: dupeEmail, password: "password123" })
    )
  );
  const dupeCreated = dupeResults.filter(r => r.status === "fulfilled" && r.value.status === 201).length;
  const dupeFailed  = dupeResults.filter(r => r.status === "fulfilled" && r.value.status !== 201).length;
  log("Only 1 account created (no duplicates)",   dupeCreated <= 1, `created: ${dupeCreated}, rejected: ${dupeFailed}`);

  // Register a user then hammer login
  console.log(`\n  [Login] ${CONCURRENT} concurrent logins for the same account`);
  const loginEmail = `login_stress_${uniqueId()}@test.com`;
  await post("/register", { name: "Login Stress", email: loginEmail, password: "password123" });

  const loginStart = Date.now();
  const loginResults = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, () =>
      post("/login", { email: loginEmail, password: "password123" })
    )
  );
  const loginMs = Date.now() - loginStart;
  const loginOk = loginResults.filter(r => r.status === "fulfilled" && r.value.status === 200).length;
  log(`All ${CONCURRENT} logins succeeded`,        loginOk === CONCURRENT, `${loginMs}ms total, avg ${(loginMs/CONCURRENT).toFixed(1)}ms each`);

  // Wrong-password hammering
  console.log(`\n  [Login] ${CONCURRENT} concurrent wrong-password attempts`);
  const badResults = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, () =>
      post("/login", { email: loginEmail, password: "wrongpassword" })
    )
  );
  const badOk = badResults.filter(r => r.status === "fulfilled" && r.value.status === 401).length;
  log(`All ${CONCURRENT} wrong attempts return 401`, badOk === CONCURRENT, `${badOk}/${CONCURRENT}`);
}

// ─── RUN ────────────────────────────────────────────────────────────────────

(async () => {
  console.log("=== Registration & Login Test Suite ===");
  try {
    await smokeTests();
    await stressTests();
  } catch (err) {
    console.error("\nFatal error:", err.message);
  }

  console.log(`\n${"─".repeat(52)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log("  All tests passed!");
  else console.log("  Some tests FAILED — see above.");
  console.log();
  process.exit(failed > 0 ? 1 : 0);
})();
