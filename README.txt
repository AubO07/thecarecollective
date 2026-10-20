THE CARE COLLECTIVE — CONNECTING THE DOTS — VERSION 3

What changed
- Removed the little green-dot brand symbol and decorative hero dot. The chart retains its meaningful connected/disconnected mint green dots.
- Retained left-aligned layout, corrected intervention marker, NHS blue #005EB8 and NCS mint green #C9FF7A.
- CSS asks for Graphik/Graphic first, with an Arial fallback. The commercial webfont is not bundled: confirm correct family name and an appropriate webfont licence before deploying a font file.
- Added an embedded PDF-request form section and a feedback section. Both are clearly labelled PREVIEW ONLY until free Tally form share links are supplied.
- All links previously going straight to the PDF from the webpage now go to the form section.

ACTIVATE THE FREE FORMS (NO CARD NECESSARY)
1. On https://tally.so make a PDF request form: required Name, required Email, optional Phone. Provide a short privacy notice about recording requests, plus separate optional marketing consent if ever desired.
2. Make its custom Thank You page include a link to https://thecarecollective.vercel.app/assets/Connecting_the_Dots_Proposal.pdf after the website is published there. Or choose the free Redirect on Completion to the same URL.
3. Make a second feedback form: name and email optional, feedback required, optionally role/organisation and willingness to collaborate.
4. In index.html near the bottom, paste the two Tally share links (https://tally.so/r/XXXXXX) into formLinks.pdf and formLinks.feedback, respectively. Once links are present, live embeds replace the disabled visual previews. Tally forms can sync free to Google Sheets.
5. Publish the whole assets folder along with the homepage. Connect this to the existing Next.js repo using its deployment conventions — this zip is a self-contained static website preview, not a ready-to-drop-in Next.js page.

PRIVACY
- Set out who controls the personal data, why it is collected, and retention/deletion information on the website before going live.
- Don't require marketing opt-in for PDF access.
- Tally free plan currently displays Tally branding; removing it is paid.
- The PDF link is unprotected if forwarded; a form gate is suitable for a record of ordinary readers, not confidential-document access control.

Source document: original 26-page proposal, unchanged.
