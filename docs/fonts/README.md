# Vendored typeface

**Roboto Slab**, variable weight 300–700, self-hosted.

| File | Subset | Size |
|---|---|---|
| `roboto-slab-latin.woff2` | `U+0000-00FF` and the general punctuation the page uses | 34 KB |
| `roboto-slab-latin-ext.woff2` | Latin Extended-A/B, IPA, Latin Extended Additional | 21 KB |

Both are the unmodified `v36` woff2 subsets Google Fonts serves, one variable
file per subset rather than one static file per weight — 55 KB for the whole
300–700 range, against roughly 680 KB for the four static TTFs vendored in the
other sites in this account.

Self-hosted rather than linked, so the page makes no third-party request, has
no external point of failure, and needs no `fonts.googleapis.com` exception in
a content policy. `unicode-range` keeps the extended subset from downloading
for text that does not need it.

## Licence

Roboto Slab is licensed under the **Apache License 2.0**. `LICENSE.txt` is the
licence text as published in
[googlefonts/robotoslab](https://github.com/googlefonts/robotoslab), the
upstream project. The files here are redistributed unmodified.

This licence covers the typeface only. It has nothing to do with the Agentic
Dataset mark in `../brand/`, which is all rights reserved.
