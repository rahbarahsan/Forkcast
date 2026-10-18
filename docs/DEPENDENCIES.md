# Dependency maintenance

The application uses Expo SDK 58, React 19.3, React Native 0.88, TypeScript 6,
and ESLint 10. The upgrade was verified incrementally from SDK 52 through each
SDK's compatibility map. `app/package-lock.json` pins the resolved dependency
tree. `backend/constraints.txt` pins the Python runtime and test dependencies.

Run `npm ci` for the app and install the backend requirements with pip. When
updating the Python constraints, use a clean environment and run the backend
suite. Keep `requirements.txt` for runtime dependencies and
`requirements-dev.txt` for development tools.

## Advisory review: October 16, 2026

Two upstream packages in Expo's development/build dependency tree have no
published patched versions:

- [braces: deeply nested pattern stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
  Metro reaches this through micromatch and its file watcher.
- [node-forge: RSA signature validation](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
  Expo CLI and its code-signing certificate tooling depend on this package.

The final audit reports 15 high-severity dependency entries from these two
advisories, with zero critical, moderate, or low entries.

These advisories propagate to parent packages in `npm audit`; they are not
independent vulnerabilities in every listed parent. Forkcast's Python request
handlers do not invoke these packages. Serving an exported web bundle does not
run Metro or Expo CLI. This limits the application's exposure but does not remove
the upstream issues. Keep development servers on trusted interfaces and reassess
when upstream patches become available.

The Xcode tooling's UUID dependency is overridden to patched CommonJS version
11.1.1. Its UUID-generation interface was verified after installation. The
underlying [UUID advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq) concerns
buffer handling in other UUID generation modes.

Review new reports with `npm audit`. Avoid accepting audit suggestions that move
Expo or React Native to an older incompatible major. Re-run TypeScript, lint,
web export, and browser tests after dependency changes. Native Android and iOS
builds require separate platform validation; browser tests cannot substitute for
that validation.
