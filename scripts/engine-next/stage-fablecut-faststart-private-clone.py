#!/usr/bin/env python3
"""Patch only a NEW, private FableCut app copy, never the production install.

Fail closed if upstream source anchors changed: do not silently patch a
newer/different NLE version. This keeps the test integration reversible.
"""
import argparse
from pathlib import Path
import shutil

APP_NEEDLE = '''    if (!d.opening.has(c.id)) d.opening.set(c.id, ExportFrameSource.open(m.src));'''
APP_REPLACE = '''    if (!d.opening.has(c.id)) d.opening.set(c.id, suesPrivateVerifiedDecodeUrl(m.src).then((verifiedSrc) => ExportFrameSource.open(verifiedSrc)));'''
BEGIN_NEEDLE = '''  runtime.exportDecode = runtime.noExportDecode ? null : { sources: new Map(), opening: new Map() };'''
BEGIN_REPLACE = '''  runtime.suesPrivateCachePromise = null; // private clone: fresh server check on each export
  runtime.exportDecode = runtime.noExportDecode ? null : { sources: new Map(), opening: new Map() };'''
HELPER = '''/* SUES PRIVATE QA faststart cache. Server validates real SHA on every export.
   This is NOT a production FableCut feature or a project media substitution. */
async function suesPrivateVerifiedDecodeUrl(src) {
  if (!src || typeof src !== "string" || !src.startsWith("/media/")) return src;
  if (!runtime.suesPrivateCachePromise) {
    runtime.suesPrivateCachePromise = fetch("/api/sues-faststart/verified", { cache: "no-store" }).then(async (r) => {
      const data = await r.json();
      if (!r.ok || data.verified !== true || data.decoderOnly !== true || data.production !== false ||
          !data.sourceMediaUrl?.startsWith("/media/") || !data.cacheMediaUrl?.startsWith("/media/") ||
          !/^[a-f0-9]{64}$/.test(data.sourceSha256 || "") || !/^[a-f0-9]{64}$/.test(data.cacheSha256 || ""))
        throw Error("Private faststart integrity gate blocked export: " + String(data.error || r.status));
      return data;
    });
  }
  const binding = await runtime.suesPrivateCachePromise;
  return src === binding.sourceMediaUrl ? binding.cacheMediaUrl : src;
}
'''
SERVER_ANCHOR = '''/* ── Server ── */\nconst server = http.createServer(async (req, res) => {'''
SERVER_REPLACE = '''/* SUES QA ONLY: private decoder-cache gateway. No production enable flag. */
if (HOST !== "127.0.0.1" || process.env.SUES_FASTSTART_PRIVATE_QA !== "1")
  throw Error("SUES private cache app refuses to listen outside explicit localhost QA mode");
const suesPrivateFaststartGateway = require("./sues-faststart-qa-gateway.cjs").createFaststartQaGateway({
  dataDir: DATA_DIR,
  host: HOST,
  sourceName: "sues-158404-original.mp4",
  cacheName: "sues-158404-original-faststart.mp4",
  sourceSha256: "9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad",
  builderPath: process.env.SUES_FASTSTART_BUILDER_PATH,
});

/* ── Server ── */
const server = http.createServer(async (req, res) => {'''
SERVER_API_ANCHOR = '''  /* API: project */'''
SERVER_API_REPLACE = '''  /* SUES private QA: hash-verified export-only cache, fail closed. */
  if (p === "/api/sues-faststart/verified" && req.method === "GET") {
    try { sendJSON(res, 200, await suesPrivateFaststartGateway.binding()); }
    catch (error) { sendJSON(res, 409, { verified: false, error: "cache or original failed integrity; export blocked" }); }
    return;
  }

  /* API: project */'''


def apply(path, old, new):
    current = path.read_text(encoding="utf-8")
    if current.count(old) != 1:
        raise ValueError(f"Cannot patch unverified upstream anchor in {path}: {current.count(old)} occurrences")
    path.write_text(current.replace(old, new), encoding="utf-8")


def stage(source_app, clone_app, gateway, builder):
    source_app, clone_app, gateway, builder = map(lambda p: Path(p).resolve(), (source_app, clone_app, gateway, builder))
    if not source_app.is_dir() or clone_app.exists() or not gateway.is_file() or not builder.is_file():
        raise FileExistsError("A new clone directory, existing upstream and existing gateway required")
    if clone_app == source_app or source_app in clone_app.parents or clone_app in source_app.parents:
        raise ValueError("Private app clone must be outside upstream production tree")
    app = (source_app / "app.js").read_text(encoding="utf-8")
    server = (source_app / "server.js").read_text(encoding="utf-8")
    for body, needle in [(app, APP_NEEDLE), (app, BEGIN_NEEDLE), (server, SERVER_ANCHOR), (server, SERVER_API_ANCHOR)]:
        if body.count(needle) != 1:
            raise ValueError("Unexpected FableCut upstream version: refusing to stage")
    shutil.copytree(source_app, clone_app, symlinks=False)
    try:
        p = clone_app / "app.js"
        apply(p, APP_NEEDLE, APP_REPLACE)
        apply(p, BEGIN_NEEDLE, BEGIN_REPLACE)
        app = p.read_text(encoding="utf-8")
        marker = "async function exportDecodeFrame(c, t) {"
        if app.count(marker) != 1:
            raise ValueError("No unique decode helper placement")
        p.write_text(app.replace(marker, HELPER + marker), encoding="utf-8")
        p = clone_app / "server.js"
        apply(p, SERVER_ANCHOR, SERVER_REPLACE)
        apply(p, SERVER_API_ANCHOR, SERVER_API_REPLACE)
        shutil.copy2(gateway, clone_app / "sues-faststart-qa-gateway.cjs")
        shutil.copy2(builder, clone_app / "sues-build-native-faststart-cache.py")
    except BaseException:
        shutil.rmtree(clone_app)
        raise
    return clone_app


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--source-app", type=Path, required=True)
    p.add_argument("--clone-app", type=Path, required=True)
    p.add_argument("--gateway", type=Path, required=True)
    p.add_argument("--builder", type=Path, required=True)
    a = p.parse_args()
    print(stage(a.source_app, a.clone_app, a.gateway, a.builder))

if __name__ == "__main__":
    main()
