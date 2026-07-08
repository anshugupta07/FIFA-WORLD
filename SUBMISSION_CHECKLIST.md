Submission Checklist — Stadium Ops Intelligence

Before submitting to the judging platform, verify these items:

1. Repository contents
   - [ ] `client/` and `server/` source folders present
   - [ ] `package.json` files at root, `client`, and `server` present
   - [ ] No `node_modules/`, `dist/`, or `.env` files committed

2. Functionality
   - [ ] `npm install` succeeds
   - [ ] `npm run build` produces the frontend `dist/` successfully
   - [ ] `npm run dev` launches the app and frontend is reachable at `http://localhost:5173`
   - [ ] `cd server && npm test` passes

3. Security & privacy
   - [ ] No API keys or secrets in source control
   - [ ] Prompts are sanitized and length-limited (see `server/server.js`)

4. Accessibility
   - [ ] Interactive elements have labels or `sr-only` text
   - [ ] Live regions used for dynamic responses (`aria-live` set)
   - [ ] Color contrast and focusability verified visually

5. Size and packaging
   - [ ] Create a ZIP excluding `node_modules/` and `dist/` OR push only tracked files to a new GitHub repo
   - [ ] Verify ZIP or repo link is < 10 MB

6. Documentation
   - [ ] `README.md` contains run commands and verification steps
   - [ ] Optional: short demo video or screenshots included in repo

Verification commands (PowerShell)

```powershell
# install dependencies
npm install

# run build
npm run build

# run tests
cd server
npm test

# create submission zip excluding node_modules and dist (robocopy example)
cd ..
mkdir submission
robocopy . submission /S /XF node_modules dist .git .vscode package-lock.json
cd submission
Compress-Archive -Path * -DestinationPath ..\stadium-ops-submission.zip
Get-Item ..\stadium-ops-submission.zip | Select-Object Name, @{Name='SizeMB';Expression={$_.Length/1MB}}
```

If you want, I can produce the `stadium-ops-submission.zip` for you now (it will exclude `node_modules/` and `dist/`).
