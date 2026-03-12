from __future__ import annotations

from dataclasses import dataclass
import os

ADDON_DIR = os.path.dirname(os.path.dirname(__file__))
WEB_DIR = os.path.join(ADDON_DIR, "web")


@dataclass(frozen=True)
class WebAssets:
    template_html: str
    style_css: str
    main_js: str
    cm_bundle_js: str
    split_bundle_js: str


_cached_assets: WebAssets | None = None


def get_web_assets() -> WebAssets:
    global _cached_assets

    if _cached_assets is None:
        _cached_assets = WebAssets(
            template_html=_read_text(os.path.join(WEB_DIR, "index.html")),
            style_css=_read_text(os.path.join(WEB_DIR, "dist", "style.css")),
            main_js=_read_text(os.path.join(WEB_DIR, "dist", "main.js")),
            cm_bundle_js=_read_text(
                os.path.join(WEB_DIR, "vendor", "codemirror", "codemirror.bundle.js")
            ),
            split_bundle_js=_read_text(
                os.path.join(WEB_DIR, "vendor", "split-grid", "split-grid.bundle.js")
            ),
        )

    return _cached_assets


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as file_handle:
        return file_handle.read()
