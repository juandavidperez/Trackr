#!/usr/bin/env python3
"""Résume un ou plusieurs rapports JUnit XML en tableau Markdown.

Usage : junit-summary.py "<titre>" fichier1.xml [fichier2.xml ...]
Utilisé par la CI pour écrire le résumé des tests dans $GITHUB_STEP_SUMMARY.
Fonctionne avec les rapports Maven Surefire (backend) et Vitest (frontend).
"""
import sys
import xml.etree.ElementTree as ET


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    title, files = sys.argv[1], sys.argv[2:]
    total = {"tests": 0, "failures": 0, "errors": 0, "skipped": 0}
    rows = []
    for path in files:
        root = ET.parse(path).getroot()
        suites = [root] if root.tag == "testsuite" else root.iter("testsuite")
        for suite in suites:
            counts = {k: int(float(suite.get(k, 0) or 0)) for k in total}
            for k in total:
                total[k] += counts[k]
            failed = counts["failures"] + counts["errors"]
            icon = "❌" if failed else "✅"
            rows.append(f"| {icon} | `{suite.get('name')}` | {counts['tests']} | {failed} | {counts['skipped']} |")

    if not files or total["tests"] == 0:
        print(f"### {title}\n\n⚠️ Aucun rapport de test trouvé.")
        return 1

    failed = total["failures"] + total["errors"]
    status = "❌ Échec" if failed else "✅ Succès"
    print(f"### {title} — {status}\n")
    print(f"**{total['tests']} tests** · {failed} en échec · {total['skipped']} ignorés\n")
    print("<details><summary>Détail par suite</summary>\n")
    print("| | Suite | Tests | Échecs | Ignorés |\n|---|---|---|---|---|")
    print("\n".join(rows))
    print("\n</details>")
    return 0


if __name__ == "__main__":
    sys.exit(main())
