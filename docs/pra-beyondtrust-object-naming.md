# The Core Principle: Name Embedding

We don't use a separate mapping table or ID field in BeyondTrust. Instead, every BT object created by our PRA API embeds Marlink context directly into its **name**, following strict deterministic patterns.

Once you know the pattern, you can instantly decode any BT object name back to its Marlink origin.

---

## Marlink "IDs" involved

| Concept | What it is | Example |
|---|---|---|
| **Customer name** | Sanitized company name: uppercase, spaces become `_` | `MAERSK` |
| **Site name** | Sanitized vessel or site name | `ROTTERDAM` |
| **Site key** | Short unique site identifier | `ROT001` |
| **Business Unit** | MT / OA / MC / EG / TE | `MT` |

---

## Decoding BeyondTrust Objects

### Group Policies

| Pattern | Meaning |
|---|---|
| `ADMINISTRATORS_MAERSK` | Administrator group policy for customer Maersk |
| `MANAGERS_MAERSK_ROTTERDAM_ROT001` | Managers of site Rotterdam for customer Maersk |
| `OPERATORS_MAERSK_ROTTERDAM_ROT001` | Operators of site Rotterdam for customer Maersk |
| `MAERSK_NOC` | Support team "NOC" of customer Maersk |
| `MARLINK_SUPERUSERS` | Global Marlink super-user policy |
| `MARLINK_OPERATORS` | Global Marlink operator policy |

### Teams

| Pattern | Meaning |
|---|---|
| `MAERSK_ROTTERDAM_ROT001` | BeyondTrust team for site Rotterdam of customer Maersk |

### Jump Policies

| Pattern | Meaning |
|---|---|
| `MAERSK_ROTTERDAM_ROT001_AUTH` | Requires approval before access |
| `MAERSK_ROTTERDAM_ROT001_NOAUTH` | No approval required |
| `MAERSK_ROTTERDAM_ROT001_NOTIFY` | Access with notification only |

### Jumpoints

| Pattern | Meaning |
|---|---|
| `MT_JPOI1_MAERSK_ROTTERDAM_ROT001` | Jumpoint #1, BU = Maritime (`MT`), site Rotterdam, customer Maersk |

The BU prefix, for example `MT` or `OA`, identifies the **Marlink business unit** responsible for the customer.

### Jump Groups

| Pattern | Meaning |
|---|---|
| `MAERSK_NOC` | Jump Group for Maersk's NOC support team |

### Users

| Pattern | Meaning |
|---|---|
| `SITE MANAGER ROTTERDAM` | Site Manager user for vessel Rotterdam |
| `AUDITOR MAERSK` | Auditor user for customer Maersk |

---

## Misc

The sanitization rules are:

- spaces and hyphens become `_`
- everything is converted to uppercase
- special characters are transliterated, for example `ü` becomes `ue`
