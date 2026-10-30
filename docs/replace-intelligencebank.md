# Bring IntelligenceBank briefs across

Vendor export instructions checked 30 October 2026: https://help.intelligencebank.com/support/solutions/articles/51000504457-how-can-i-export-results-from-a-brief-form-record-

An administrator opens the relevant database menu, chooses Export, selects General Use or Re-Import and exports the Excel report. The vendor says this includes published and archived records, excludes drafts, and exports attachment file names rather than the attached files. Preserve those files separately and account for drafts separately. A report is not a complete platform backup.

Save the relevant worksheet as UTF-8 CSV. Field names are customer configured. Copy fixtures/intelligencebank-map.json and map each logical field to its actual exported header. The fictional fixture demonstrates the contract; it is not presented as an untouched vendor export. Record ID must be stable across exports. Add a unique brief code and explicit NZ, AU or other jurisdiction if the report lacks them. Normalise due dates to YYYY-MM-DD and document those transformations. Reference identifies the exact creative version. Preserve the original report privately.

Required logical fields: source_id, code, name, owner, campaign, jurisdiction, due, copy, channel, reference. No optional assumptions or inferred approval states are applied.

```bash
node scripts/approvals.mjs import intelligencebank imports/records.csv --map=imports/field-map.json --actor="Operator" --dry-run
node scripts/approvals.mjs import intelligencebank imports/records.csv --map=imports/field-map.json --actor="Operator"
```

The import is one command after export and mapping. It retains every original CSV field in source_data. It is atomic: an invalid row rolls back the whole file. An identical source ID and row is a no-op. A changed row with the same source ID is rejected for reconciliation. It never silently overwrites local work. Duplicate source IDs within one file are rejected. New imports always become local drafts with a first wording version.

Reconcile record counts and inspect each mapped field. Review jurisdiction, owner, due date and wording against the source. Inventory factual claims and attach the supporting evidence. Request and record current brand/legal decisions. Historical approvals, comments, markup, binary attachments, portals, media processing and integrations need a separate agreed migration. Imported vendor status is retained in the source row if present but never treated as local approval.

Use node scripts/approvals.mjs export --out=exports/unique-backup.json for a complete private JSON archive of this database, including source rows and history. Create exports/ first. Files are never overwritten. JSON export is a backup/interchange artifact, not an automatic restore command. Use database backups for recovery and test them before switching off any source service. A complete platform migration in one day is not promised.
