#!/usr/bin/env python3
"""Regenerate src/engine/data/index.ts from whatever vectors are on disk.

The vectors are copied, never edited here, so the index is derived rather than
maintained: adding a vector upstream and re-running `make vectors` is the whole
update path.
"""
import pathlib

base = pathlib.Path(__file__).resolve().parent.parent / 'src/engine/data'
vecs = sorted(p.name for p in (base / 'vectors').glob('*.json'))
worlds = sorted(p.name for p in (base / 'worlds').glob('*.json'))


def ident(name):
    return 'v_' + name.removesuffix('.json').replace('-', '_')


lines = [
    "// Generated index of the normative suite. The vectors and worlds are CC0",
    "// (see ./LICENSE) and are copied verbatim from the `reference` repository's",
    "// conformance distribution -- not re-typed, not adapted. Regenerate with",
    "// `make vectors` after copying a newer set in.",
    "",
]
lines += [f"import {ident(v)} from './vectors/{v}'" for v in vecs]
lines += [f"import w_{w.removesuffix('.json')} from './worlds/{w}'" for w in worlds]
lines += ["", "import type { RawVector } from '../runner'", "import type { World } from '../types'", ""]
lines += ["export const RAW_VECTORS: Record<string, RawVector> = {"]
lines += [f"  '{v.removesuffix('.json')}': {ident(v)} as RawVector," for v in vecs]
lines += ["}", "", "export const WORLDS: Record<string, World> = {"]
lines += [
    f"  '{w.removesuffix('.json')}': w_{w.removesuffix('.json')} as unknown as World,"
    for w in worlds
]
lines += ["}", ""]

(base / 'index.ts').write_text("\n".join(lines))
print(f"generated index.ts for {len(vecs)} vectors, {len(worlds)} world(s)")
