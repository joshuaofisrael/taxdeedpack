# Locked pack rule: source traceability

No material fact enters the final PDF unless it is traceable to an actual source.
If the source does not establish it, output NOT VERIFIED.

## Requirements
1. Every material factual assertion in the Research Pack PDF must include a citation to an actual retrieved source (URL, document id, recorder book/page, assessor parcel page, FEMA map panel, etc.).
2. If a field cannot be established from a retrieved source at generation time, the PDF must show the literal status NOT VERIFIED (or NOT FOUND / UNKNOWN / UNAVAILABLE where those labels are already defined) rather than a guessed, inferred, or model-invented value.
3. Automated / AI extraction may propose candidates, but nothing may be written as established fact without a matching source artifact. Prefer omit or NOT VERIFIED over unsupported conclusions.
4. Comp tables: only rows with a source for the sale transaction. No ARV / value opinion.
5. Lien / obligation flags: only items with a public-record source; absence of an item is never a conclusion that none exist.
6. Zoning / flood / use: PASS / FAIL / UNKNOWN only when the cited public source supports that checkbox outcome; otherwise NOT VERIFIED / UNKNOWN.
7. Bid Scenario Analysis: labeled hypotheticals only; arithmetic from stated inputs; never presented as verified market facts.
8. Store source URLs / ids alongside each fact in the order JSON so audits can re-check the PDF.

## Footnotes (required presentation)

Every material fact in the body of the PDF must show a superscript footnote marker (1, 2, 3, …).
A Footnotes / Sources section at the bottom of the PDF (end of report, and optionally per page footer if the generator supports it) lists each number with the actual source: title/agency, retrieval date, and URL or record identifier.
NOT VERIFIED facts either have no footnote, or a footnote that states no establishing source was retrieved.
Do not put bare URLs only in the body without the numbered footnote system.
