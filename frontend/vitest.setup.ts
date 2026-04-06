/**
 * 36 Vitest setup: ensure React is in scope for JSX in component sources (Next.js automatic runtime)
 */
import React from "react";
(globalThis as unknown as { React: typeof React }).React = React;
