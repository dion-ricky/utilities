# Stage 3 — Crypto & Security Suite (13 tools)

## Goal

Full client-side crypto surface. Security stance: private keys, tokens, and plaintext never leave
the tab; state this on every crypto tool page.

| # | Tool | Slug | Implementation |
|---|---|---|---|
| 1 | MD5 hash | `md5-hash` | tiny lib (`spark-md5`); note: legacy/checksums only |
| 2 | File checksum | `file-checksum` | drop file → SHA-1/256/384/512 (+MD5) via streaming read |
| 3 | HMAC generator | `hmac-generator` | Web Crypto; MD5 via lib for parity |
| 4 | AES encrypt/decrypt | `aes-cipher` | Web Crypto AES-GCM; passphrase→key via PBKDF2; output base64 |
| 5 | Password strength analyzer | `password-strength` | `zxcvbn-ts`; crack-time estimate |
| 6 | Token/random string generator | `token-generator` | `crypto.getRandomValues`; charset, prefix/suffix, bulk |
| 7 | ULID generator | `ulid-generator` | `ulid`; monotonic mode; bulk |
| 8 | TOTP/HOTP generator | `totp-generator` | `otpauth`; live 30s countdown ring; enrollment QR (reuse Stage 1 QR) |
| 9 | Bcrypt hash/verify | `bcrypt` | `bcryptjs`; cost slider |
| 10 | RSA key pair generator | `rsa-key-generator` | Web Crypto `generateKey`; 2048/4096; export PEM (SPKI/PKCS8) |
| 11 | BIP39 mnemonic generator | `bip39-generator` | `bip39`; 12/24 words; optional passphrase (25th word) |
| 12 | Basic Auth header generator | `basic-auth-generator` | `btoa(user:pass)` → `Authorization` header |
| 13 | UUID parser/inspector | `uuid-parser` | validate; show version, variant; v1 MAC/time; v7 timestamp |

## Acceptance criteria

- [ ] 13 tools deployed; each shows a "runs locally, nothing is uploaded" note.
- [ ] `hash-text` gains MD5 column (cross-link from Stage 1 tool).
- [ ] Web Crypto ops use async workers where input may be large (file checksum).
- [ ] Negative tests: invalid base64/JWT/TOTP secrets handled with clear errors.
- [ ] Release tagged.
