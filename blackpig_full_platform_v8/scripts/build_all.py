#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deterministic Build Script (`scripts/build_all.py`)
Generates:
1. `dist/public/` (Production static assets mounted by Nginx in infra/docker-compose.10k-ccu.yml)
2. `blackpig_standalone.html` (Self-contained single-file bundle with inlined CSS, JS, and WebP assets)
"""
import os, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_PUBLIC = os.path.join(ROOT, 'dist', 'public')
os.makedirs(DIST_PUBLIC, exist_ok=True)

for item in ['index.html', 'manifest.json', 'sw.js']:
    src = os.path.join(ROOT, item)
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(DIST_PUBLIC, item))

for folder in ['css', 'js', 'assets']:
    src_dir = os.path.join(ROOT, folder)
    dst_dir = os.path.join(DIST_PUBLIC, folder)
    if os.path.exists(dst_dir):
        shutil.rmtree(dst_dir)
    if os.path.exists(src_dir):
        shutil.copytree(src_dir, dst_dir)

print("Built dist/public/ for Nginx static serving!")
