# Public site handoff

`site/` is a buildless static site for the Sponsor Not Sponsor homepage, privacy policy, support route, and stable fictional reviewer demo. It has no runtime dependencies, analytics, forms, remote assets, or deployment identity. Serve or upload the contents of `site/` without changing its directory structure.

Published with HTTPS enforced:

- Homepage: `https://eni-akin.github.io/sponsor_not_sponsor/`
- Privacy: `https://eni-akin.github.io/sponsor_not_sponsor/privacy.html`
- Support: `https://eni-akin.github.io/sponsor_not_sponsor/support.html`
- Reviewer demo: `https://eni-akin.github.io/sponsor_not_sponsor/demo.html`

## Owner inputs before deployment

1. Confirm GitHub Pages' request logging and privacy terms. Add host-specific disclosure if the owner determines it is required; this package adds no analytics or form submission.
2. Review trademark clearance, policy wording, and the demo result. The repository's human accessibility and independent real-world validation gates remain separate release blockers.
3. Enter the published privacy and support URLs in the Chrome Web Store dashboard and use the demo URL in reviewer instructions.

## Local check and preview

Run the template check while the owner values are intentionally unresolved:

```sh
node release/public-site/validate.mjs
```

After replacing both owner values, require deployment readiness with:

```sh
node release/public-site/validate.mjs --release
```

For a local preview from the repository root:

```sh
python3 -m http.server 4173 --directory release/public-site/site
```

Then open `http://127.0.0.1:4173/`. Stop the server when review is complete.

## Reviewer path after deployment

1. Install Sponsor Not Sponsor 0.6.0 and allow access to the deployed demo origin.
2. Open `/demo.html` and reload once after installation if needed.
3. Expect **Explicit blocker found**, supported by “Visa sponsorship is not available for this position.”
4. Open the evidence panel to review the quotation, then test pause, site disable, Scan again, and the optional local report download.

The demo is authored fictional evidence. It verifies a predictable review path; it does not establish independent real-world accuracy.
