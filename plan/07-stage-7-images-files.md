# Stage 7 — Images & Files (Canvas / WASM) (7 tools)

## Goal

File-processing tools that normally need a server — done client-side with Canvas, WASM, and
lazy-loaded libraries. Show progress bars for heavy ops.

| # | Tool | Slug | Implementation |
|---|---|---|---|
| 1 | Image compressor/resizer | `image-compressor` | canvas; quality slider; target dimension/percent; before/after size |
| 2 | Image format converter | `image-converter` | canvas `toBlob`: PNG/JPEG/WebP (feature-detect AVIF) |
| 3 | Image → Base64 | `image-to-base64` | FileReader; CSS/HTML/MD snippet outputs |
| 4 | EXIF viewer & stripper | `exif-tool` | `exifr` (view) + re-encode to strip (privacy note) |
| 5 | Palette from image | `palette-from-image` | canvas + median-cut quantization; export HEX list |
| 6 | PDF organizer | `pdf-organizer` | `pdf-lib`: merge, split, rotate, delete pages, page numbers |
| 7 | OCR (image → text) | `ocr-text` | `tesseract.js` (WASM); model lazy-download with progress; cached for offline |

## Acceptance criteria

- [ ] 7 tools deployed; file-size guard + clear errors on unsupported formats.
- [ ] OCR works offline after first model load (document the one-time download).
- [ ] EXIF strip verified by re-running the viewer on output (no tags remain).
- [ ] Large-file path tested (≥ 10 MP image, ≥ 50-page PDF) without UI freeze (async + progress).
- [ ] Release tagged.
