// Creates only SQL for two disposable Auth test fixtures; never changes real users.
import { randomBytes, randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { hashSync } from "bcryptjs";
const suffix = randomBytes(6).toString("hex"),
  password = randomBytes(24).toString("base64url");
const users = [0, 1].map((i) => ({
  id: randomUUID(),
  email: `taste-e2e-${suffix}-${i}@example.invalid`,
}));
writeFileSync(
  ".env.test.local",
  `TEST_EMAIL=${users[0].email}\nTEST_PASSWORD=${password}\nTEST_OTHER_EMAIL=${users[1].email}\nTEST_OTHER_PASSWORD=${password}\nTEST_USER_ID=${users[0].id}\nTEST_OTHER_USER_ID=${users[1].id}\n`,
  { mode: 0o600 },
);
const hash = hashSync(password, 10);
const sql = users
  .map(
    (u) =>
      `insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,confirmation_token,recovery_token,email_change_token_new,email_change,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values ('00000000-0000-0000-0000-000000000000','${u.id}','authenticated','authenticated','${u.email}','${hash}',now(),'','','','','{"provider":"email","providers":["email"]}','{"test_fixture":"taste-lens-e2e"}',now(),now());\ninsert into auth.identities(provider_id,user_id,identity_data,provider,created_at,updated_at) values ('${u.id}','${u.id}','{"sub":"${u.id}","email":"${u.email}","email_verified":true}','email',now(),now());`,
  )
  .join("\n");
writeFileSync("/tmp/taste-lens-test-users.sql", sql, { mode: 0o600 });
console.log(
  "Prepared two disposable fixture identities (credentials withheld).",
);
