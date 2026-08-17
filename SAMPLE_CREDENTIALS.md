# ARATC LMS Sample Login Credentials

## How to Use

Run the seed script to create sample users:

```bash
cd packages/database
npx prisma db seed
```

---

## Test Accounts

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `admin@aratc.edu.ph` | `Test@1234` | Super Admin | Full system access |
| `content@aratc.edu.ph` | `Test@1234` | Content Admin | Manage questions & content |
| `school@aratc.edu.ph` | `Test@1234` | School Admin | Manage school operations |
| `teacher@aratc.edu.ph` | `Test@1234` | Teacher | Create & manage classes |
| `student@aratc.edu.ph` | `Test@1234` | Student | Access learning materials |
| `parent@aratc.edu.ph` | `Test@1234` | Parent | Monitor child's progress |

---

## Quick Reference

### For Local Development

```bash
# Seed the database with sample users
npm run db:seed

# Or directly with prisma
npx prisma db seed
```

---

## Notes

- All accounts use the same password: `Test@1234`
- Student account includes a learner profile with Grade 7 settings
- All accounts are set to `ACTIVE` status for immediate testing
- To reset a user's password in the database, you can update the `passwordHash` field

---

## Password Requirements

The system requires passwords with:
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number
- One special character (!@#$%^&*)
