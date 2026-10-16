# Simple public GitHub Pages portfolio

HTML + CSS + JavaScript + data.json. No Python, SQL, server, keys or hosting fees needed for the static version.

## Publish
1. Extract the ZIP.
2. Create a public GitHub repository.
3. Upload ALL extracted contents, preserving the assets/ folder. index.html must be at the repository ROOT, not inside another folder.
4. Settings → Pages → Deploy from a branch → main → /(root) → Save.
5. Open the website URL GitHub shows when deployment finishes.

## Basic admin editor
Password: Vivek@Portfolio2026
It is hardcoded at the top of app.js. You can change that string, but ANY visitor can read it in the public repository or browser source. It is NOT secure authentication. Do not reuse a real password.

User opens Portfolio / Projects / Résumé. Admin opens a full-page password screen and local editor.

## Data and editing
- data.json is a PUBLIC static data file, not a SQL database or online write API.
- Admin Save browser draft saves only in your own browser localStorage. Other visitors do not see it.
- To publish edits, click Download updated data.json; replace the repository's root data.json and commit. GitHub Pages redeploys the site.
- Import JSON restores a downloaded draft. Reset restores the published data loaded when the page opened.
- Your browser may retain an older local draft. Use Reset in the editor to see published data there; other visitors without a local draft read the published JSON.
- To replace the public résumé, replace assets/resume.pdf on GitHub and commit. Original PDF bytes are included unchanged.
- No private Word files are included. Anything committed to a public repo can be downloaded, regardless of which buttons are hidden.
- Do not put API keys, passwords you actually rely on, confidential documents, personal secrets, or GitHub tokens into this site.
- The résumé includes contact details and is intentionally public; review it before publishing. Deleting a file later may not remove it from Git history.

## Preview
JSON uses fetch, so opening index.html with file:// may not work. Use GitHub Pages, or run python -m http.server 8000 from this directory and visit http://localhost:8000 . Python is optional for local preview only, not required for hosting.

## Files
index.html : layout
style.css : styling
app.js : behavior + public demo admin password
data.json : public content
assets/resume.pdf : original résumé
.nojekyll : static Pages marker

## Verification
ZIP integrity, JSON structure, original PDF byte preservation and required file presence checked during generation. Browser/device testing was not performed. This static version intentionally replaces the previous secure backend; it does NOT provide AES encryption, real authentication, or automatic GitHub updates.
