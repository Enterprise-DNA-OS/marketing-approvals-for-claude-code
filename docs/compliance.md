# Claim evidence and review checks

Checked 30 October 2026. These checks find missing records. They cannot determine whether a representation is legally permissible, whether evidence is sound, or whether the overall impression is misleading. The business and its reviewers make those judgments. This base does not assume regulatory responsibility or supply financial, medical or other sector-specific advertising rules.

## NZ-FTA-12A / AU-ACL-18

The NZ Commerce Commission explains that businesses need reasonable grounds when making factual representations about goods or services. Source: https://www.comcom.govt.nz/__data/assets/pdf_file/0030/89850/Unsubstantiated-representations-Fact-sheet-July-2018.pdf

The ACCC explains that product and service claims must be accurate, truthful and based on reasonable grounds. Context and omissions also matter. Source: https://www.accc.gov.au/consumers/advertising-and-promotions/false-or-misleading-claims

The v_claims view reports a missing evidence reference or an expired reviewer-defined validity date for each inventoried current claim. The validity date is an internal review date, not a statutory expiry period. Recording a reference does not validate its contents. The system does not read the document or discover every claim automatically.

## LOCAL-CLAIM-INVENTORY

Every brief needs an explicit claim inventory before its release can be recorded. A zero count is held for review, even if the operator considers the creative non-factual. This is a local operating rule, not a legal requirement. Use a documented customisation for genuinely claim-free material.

## LOCAL-TWO-REVIEWS

Brand and legal review roles must both be requested for the current version. This is a local control, not a legal requirement for every advertisement. Configure the roles for the business through a migration and test change.

## LOCAL-VERSION-REVIEW

Every current review request must have a latest approved decision. Changes and rejection remain blocking. Adding a new wording version leaves all previous decisions with their previous wording. Claims cannot be added after reviews start. New evidence after a decision requires a revision. These are local controls against stale approval, not statutory rules.

Run node scripts/approvals.mjs compliance. Its rule IDs correspond to the sections here. record-release requires current support and approvals and checks that their recorded dates cover the release date. It records an external action only. It does not authorise or perform publication.

No automatic retention or deletion period is imposed. Keep evidence according to the business's legal and privacy obligations. The owner connection can bypass database rules, so this is not a tamper-proof audit system or authenticated signature service.
