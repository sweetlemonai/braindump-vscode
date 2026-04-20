# Releasing Braindump

Braindump is published manually via the marketplace web form. There is
no `vsce publish` or PAT in this workflow.

## Maintainer checklist

Run in order, from a clean tree on the branch you intend to release
(typically `v2` for `1.0.0`, or a release branch thereafter):

```sh
# 1. Regenerate theme JSONs from scripts/build-themes.ts.
npm run build:themes

# 2. Run the full check suite. All must pass.
npm run typecheck && npm run lint && npm test

# 3. Produce the VSIX. `vsce package` triggers the vscode:prepublish
#    hook, which rebuilds themes and bundles src/extension.ts with
#    esbuild (--production). Output: braindump-<version>.vsix.
npx @vscode/vsce package

# 4. Inspect the .vsix before upload. `vsce ls` dumps the file list
#    without writing an archive:
npx @vscode/vsce ls
#    Or unzip the .vsix into a scratch directory and eyeball it.
#    Confirm dist/extension.js, themes/*.json, syntaxes/*.json,
#    snippets/*.json, language-configuration.json, README, CHANGELOG,
#    LICENSE, and images/logo.jpg are all present; nothing from
#    src/, docs/, examples/, scripts/, .github/, .claude/, or
#    node_modules/ is.

# 5. Upload the .vsix via the marketplace web form:
#    https://marketplace.visualstudio.com/manage/publishers/purple-vision
#    New Extension → drag in braindump-<version>.vsix.

# 6. After the listing shows the new version, tag the commit locally
#    and push the tag.
git tag v<version>
git push origin v<version>
```

## Version bumping

Bumping `version` in `package.json` is manual. Bump before step 3 so
the VSIX filename encodes the version you're uploading.

## Gotchas

- The `vscode:prepublish` hook runs both `build:themes` and the
  production `compile` step. If either fails, `vsce package` stops; no
  VSIX is written. Fix and re-run.
- `.vscodeignore` is the single source of truth for what ships. Do not
  rely on `.gitignore` — the VSIX packager uses only `.vscodeignore`.
- The marketplace rejects a VSIX whose manifest version isn't strictly
  greater than the currently published one. Yank-and-re-upload at the
  same version is not supported; bump patch first.
