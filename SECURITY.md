# Security Policy

## 🔒 Secrets Management

### What Should NEVER Be Committed

The following should **NEVER** be committed to Git:

- API Keys (all types)
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
  - `MURF_API_KEY`
  - `DEEPGRAM_API_KEY`
  - `GOOGLE_API_KEY`
  - `OPENAI_API_KEY`

- Private/Sensitive URLs
  - `LIVEKIT_URL` (contains instance identifier)
  - SIP trunk IDs
  - Database credentials

- Local Configuration Files
  - `.env.local`
  - `.env.*.local`
  - Any `.env` file NOT named `.env.example`

### Protected by .gitignore

The repository has `.gitignore` rules that automatically prevent committing:

```
.env
.env.*
!.env.example
```

This means:
- ✅ `.env.example` IS committed (template with placeholders)
- ❌ `.env.local` is NOT committed (local secrets)
- ❌ `.env.production` is NOT committed (production secrets)
- ❌ Any other `.env.*` file is NOT committed

### Setup Instructions for Users

1. **Copy template:**
   ```bash
   cp backend/.env.example backend/.env.local
   ```

2. **Fill in real values:**
   ```bash
   # Edit backend/.env.local
   LIVEKIT_API_KEY=your_actual_key_here
   MURF_API_KEY=your_actual_key_here
   # ... etc
   ```

3. **Never commit:**
   ```bash
   # DON'T DO THIS:
   git add backend/.env.local
   
   # Git will refuse anyway due to .gitignore
   ```

---

## 🔑 Current Repository Status

### Day 6 Branch
- ✅ No API keys in commits
- ✅ No secrets in documentation
- ✅ `.env.local` is not tracked
- ✅ `.env.example` provides template

### Main & Other Branches
- ✅ `.env.local` never committed
- ✅ Only `.env.example` exists
- ✅ Safe for public repository

### All Branches
- ✅ .gitignore properly configured
- ✅ No hardcoded secrets in code
- ✅ No secrets in logs
- ✅ No secrets in documentation

---

## 🛡️ Best Practices

### For Development
1. Always use `.env.local` (never committed)
2. Copy from `.env.example` as template
3. Never commit `.env.local`
4. Test `.gitignore` before committing

### For CI/CD
1. Use GitHub Secrets for sensitive variables
2. Never echo secrets in logs
3. Rotate keys if accidentally exposed
4. Use environment variables in pipelines

### For Documentation
1. Use placeholder values in examples
2. Reference `.env.example` for configuration
3. Never include real keys in READMEs
4. Link to security documentation

---

## 🔄 If Secrets Are Accidentally Committed

### Immediate Actions
1. **Revoke** the exposed API key immediately
2. **Generate** a new API key
3. **Update** `.env.local` with new key
4. **Notify** relevant services

### Clean Up Repository
1. Do NOT just remove and re-commit (history remains)
2. Use `git filter-branch` to remove from history
3. Force-push to update remote: `git push -f`
4. Notify all collaborators

### Example Cleanup
```bash
# This removes a secret from ALL commits:
git filter-branch --tree-filter "sed -i 's/old_secret/\[REDACTED\]/g'" -f -- --all

# Force push to update remote:
git push -f --all
```

---

## 📋 Configuration Checklist

Before deploying:

- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.example` is committed (no real values)
- [ ] No secrets in `.py` files
- [ ] No secrets in `.tsx` / `.ts` files
- [ ] No secrets in `.md` files
- [ ] No secrets in `.json` config files
- [ ] All credentials loaded from environment variables
- [ ] Logging doesn't expose secrets

---

## 🚨 Security Headers

### In Code
```python
# DO THIS:
api_key = os.getenv("MURF_API_KEY")

# DON'T DO THIS:

```

### In Logs
```python
# DO THIS:
logger.info(f"Connecting to: {url[:30]}...")

# DON'T DO THIS:
logger.info(f"API Key: {api_key}")
```

### In Documentation
```markdown
# DO THIS:
Copy `backend/.env.example` to `backend/.env.local` and fill in your credentials.

```

---

## 📞 Questions or Concerns?

If you discover a security issue:

1. **Do NOT** open a public GitHub issue
2. **Report privately** to repository owners
3. **Include** details of the vulnerability
4. **Wait** for confirmation before disclosure

---

*Last Updated: August 12, 2026*  
*Status: All Secure ✅*
