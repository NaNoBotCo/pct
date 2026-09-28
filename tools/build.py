"""Assemble docs/index.html from tools/page.html + tools/traditions.html."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t = lambda p: open(os.path.join(ROOT, "tools", p), encoding="utf-8").read()
trad = t("traditions.html").split("\n", 1)[1]
open(os.path.join(ROOT, "docs", "index.html"), "w", encoding="utf-8").write(t("page.html").replace("<!--TRADITIONS-->", trad))
