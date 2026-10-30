# Marketing Approvals for Claude Code

Keep exact marketing wording, its supporting evidence and the decision about that version together in a database you own.

## Three ways to use it

- **Do it yourself:** free MIT source. Install Node 20 or later, run the demo, then use Claude Code, Codex, OpenCode or Cursor with the same commands. Hosting and agent subscriptions are separate.
- **We customise it:** your IntelligenceBank records mapped, your review roles and rules, your access controls and connected proofing built around your business. One setup fee, then a retainer.
- **We run it for you:** installation, backups, controlled access and the weekly approvals desk through Omni by Enterprise DNA. One setup fee, then a retainer.

[Book 30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=intelligencebank&utm_medium=readme).

## The bill and the scope

IntelligenceBank's [vendor-authored marketplace offer](https://aws.amazon.com/marketplace/pp/prodview-35ui55oaagquq) lists an indicative US$15,000 starting annual Marketing Ops contract, checked 30 October 2026. It is a starting price, not a customer invoice or a quote for every compliance feature.

This base covers briefs, wording versions, inventoried claims, evidence references, brand/legal review records, deadlines and recorded external releases. It does not replicate media processing, visual markup, authenticated approval portals or website scanning. A trusted operator records decisions made externally. No command sends or publishes. Legal review remains with the business and its advisers.

## Start with fictional data

```bash
npm install
npm test
npm run demo
```

The demo runs in a disposable PGlite database and removes it afterwards. For an empty working database, run npm run migrate. DATABASE_URL selects private Postgres. Without it, DATA_DIR selects local embedded storage. The seed requires DEMO_DATA=yes and is for disposable databases only. Never seed the working database.

```bash
node scripts/approvals.mjs attention
node scripts/approvals.mjs claim-evidence --json
node scripts/approvals.mjs review-queue
npm run view
npm run docs
```

The weekly rituals are /review-queue, /claim-evidence, /expiry-watch, /launch-readiness and /weekly-review. /compliance checks missing records against the sourced rules in docs/compliance.md. A clean record check does not establish legal compliance or prove a claim is true.

## Commands

- /briefs: List briefs and accountable owners. Run `node scripts/approvals.mjs briefs`.
- /brief: Read one brief and its version history. Run `node scripts/approvals.mjs brief "<code or name>"`.
- /review-queue: Find the brand and legal decisions still needed. Run `node scripts/approvals.mjs review-queue`.
- /claim-evidence: Show the wording and evidence behind current claims. Run `node scripts/approvals.mjs claim-evidence`.
- /expiry-watch: Find missing, expired and soon-expiring support. Run `node scripts/approvals.mjs expiry-watch`.
- /launch-readiness: Check the current version before a launch review. Run `node scripts/approvals.mjs launch-readiness`.
- /attention: Find late briefs, evidence gaps and missing reviews. Run `node scripts/approvals.mjs attention`.
- /owner-load: Balance open work and overdue briefs by owner. Run `node scripts/approvals.mjs owner-load`.
- /compliance: Check record gaps using docs/compliance.md. These are evidence checks, not a legal determination. Run `node scripts/approvals.mjs compliance`.
- /releases: Read the record of releases performed outside this system. Run `node scripts/approvals.mjs releases`.
- /history: Read the append-only activity history. Actor labels are not authenticated identities. Run `node scripts/approvals.mjs history`.
- /insights: Answer the ten cross-record questions using actual output. Run `node scripts/approvals.mjs insights`.
- /add: Create a draft brief from supplied facts. Run `node scripts/approvals.mjs add --code=<unique> --name="<title>" --owner="<owner>" --campaign="<campaign>" --jurisdiction=NZ --due=YYYY-MM-DD --copy="<exact wording>" --channel=email --reference="<creative evidence>" --actor="<operator>"`.
- /revise: Add a new wording version. Old claims and reviews stay with the old version. Re-inventory claims, attach support and obtain fresh decisions. Run `node scripts/approvals.mjs revise --brief=<code> --copy="<new exact wording>" --channel=email --reference="<creative version reference>" --actor="<operator>"`.
- /add-claim: Inventory a factual claim before requesting review. Claim inventory freezes once reviews start. Run `node scripts/approvals.mjs add-claim --brief=<code> --code=<unique-claim-code> --statement="<exact claim>" --kind=performance --actor="<operator>"`.
- /evidence: Record the actual basis for one current claim. Evidence does not itself prove that a claim is true. Dates are chosen by the reviewer. If decisions exist, revise first. Run `node scripts/approvals.mjs evidence --brief=<code> --claim=<claim-code> --reference="<source reference>" --explanation="<why this supports the claim>" --date=YYYY-MM-DD --until=YYYY-MM-DD --reviewer="<reviewer>" --actor="<operator>"`.
- /request-review: Create a local review request. Nothing is sent. Use brand and legal roles, with the real reviewer and agreed due date. Run `node scripts/approvals.mjs request-review --brief=<code> --role=brand --reviewer="<reviewer>" --due=YYYY-MM-DD --actor="<operator>"`.
- /decision: Record a decision already made externally, with its evidence. Never approve for someone else. Decisions are approved, changes or rejected. A correction appends a new decision. Run `node scripts/approvals.mjs decision --brief=<code> --role=brand --reviewer="<reviewer>" --decision=approved --reference="<external decision evidence>" --rationale="<review conclusion>" --date=YYYY-MM-DD --actor="<operator>"`.
- /record-release: Record a release already performed outside this system. The current version must have supported claims and both review roles approved. This command never publishes or sends. Run `node scripts/approvals.mjs record-release --brief=<code> --date=YYYY-MM-DD --location="<external location>" --reference="<release evidence>" --actor="<operator>"`.
- /withdraw: Record withdrawal of a brief. This changes local status only. The operator must arrange removal at every external location. Run `node scripts/approvals.mjs withdraw --brief=<code> --reason="<reason>" --reference="<withdrawal evidence>" --actor="<operator>"`.
- /log: Append a factual note or correction to the brief. Run `node scripts/approvals.mjs log --brief=<code> --body="<factual note>" --actor="<operator>"`.
- /import: Read docs/replace-intelligencebank.md. Preview a mapped CSV saved from the vendor Excel export. Reconcile counts, then repeat without --dry-run. All imported records are drafts. Run `node scripts/approvals.mjs import intelligencebank <CSV> --map=<JSON> --actor="<operator>" --dry-run`.
- /export: Save all records, source rows and history to a new private file. Create the destination directory first. Existing files are never overwritten. Run `node scripts/approvals.mjs export --out=exports/<unique-name>.json`.
- /draft-chase: Prepare a local reminder worksheet. Review each person and current version. Never send. Run `node scripts/approvals.mjs draft-chase`.
- /draft-brief: Prepare a local brief review draft from actual records. Never publish or send. Run `node scripts/approvals.mjs draft-brief --brief=<code>`.
- /weekly-review: Run attention, claim-evidence and review-queue first, then generate the draft. Report their actual results and retain the file in drafts/. Never invent missing evidence. Run `node scripts/approvals.mjs weekly-review`.

/view renders the weekly and evidence reports. /documents renders draft approval packs and launch worksheets. /customise adds a field or changes a local rule through a tested migration. /new-view adds a read-only report. Put the business name, logo and colours in brand.json.

All reads accept --json. IDs accept unambiguous prefixes; names match without case. Ambiguity lists candidates and exits with an error. Flags use --name=value. All mutations and imports are transactional and recorded with --actor. Actor names are labels, not authenticated signatures. Append a decision or note to correct history; never rewrite it.

## Switch with the records you have

Read [the switching guide](docs/replace-intelligencebank.md). Export the vendor Excel records report, save a CSV, map its configured columns, preview and reconcile, then run one import command. The fictional fixture documents the mapping contract. Vendor drafts and attached files are excluded from that export. Historical decisions are not silently treated as current approval.

```bash
node scripts/approvals.mjs import intelligencebank fixtures/intelligencebank-records.csv --map=fixtures/intelligencebank-map.json --actor="Demo operator" --dry-run
```

A revision starts a fresh claim inventory and review cycle. Claim inventory freezes when reviews start. Evidence changes after a decision require a revision. Recorded releases require current evidence, both review roles, and dates that cover the recorded release. This records an external action only. Keep operating source services until migration and access controls are checked.

## Ten questions answered from your records

/insights answers these from the current database. They are not claims that IntelligenceBank cannot build custom reports.

1. Which overdue launches still have evidence gaps?
2. Which environmental claims have expired support?
3. Which reviewers are holding up more than one brief?
4. Which campaigns have overdue work?
5. Which briefs have no claim inventory?
6. Which current versions are missing a required review role?
7. Which approved claims need evidence renewed within a month?
8. Which owners have both late work and missing evidence?
9. Which briefs need changes rather than another reminder?
10. Which imported briefs still need local review?

## Your first hour: ten things to ask for

1. Show overdue briefs by owner.
2. Find environmental claims with expired evidence.
3. Show each reviewer their outstanding queue.
4. Tell me which launches are blocked by missing support.
5. Draft the Monday review.
6. Prepare an approval pack for the refill campaign.
7. Show the exact wording behind a decision.
8. Put our name and colours on the worksheets.
9. Add our cost-centre field through /customise.
10. Create a campaign-specific report through /new-view.

## Verification and boundaries

npm test exercises every read and write, seed idempotence, revision invalidation, evidence and approval gates, ambiguity, atomic imports, repeat imports, source conflicts, malformed CSV, JSON exports, local drafts and escaped HTML. The 85-check suite passed locally on Linux with PGlite and Postgres 18. A manual GitHub workflow covers Windows and Linux with PGlite and Linux with Postgres 17. See docs/research.md for the selection evidence.

This is one private database for a trusted operator. The database owner can bypass checks. Do not expose that connection or call the history tamper-proof. A managed deployment needs authenticated access, backups and private evidence storage. Keep source files, exports and generated reports outside Git.
