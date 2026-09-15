import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["components/collab/CollabProvider.tsx"],
    rules: {
      // These effects intentionally synchronize React state with browser APIs,
      // realtime data and an interval-driven lock expiry pass.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["components/collab/Editable.tsx"],
    rules: {
      // The timestamp is display-only and is refreshed by the provider heartbeat.
      "react-hooks/purity": "off",
      // Editable renders a dynamic intrinsic element via createElement; forwarding
      // its DOM ref is intentional and does not read ref.current during render.
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
