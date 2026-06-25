import os
from bs4 import BeautifulSoup
import glob

ROOT_DIR = "/Users/vvm/fifa/landings"
DOMAINS = {
    "copa26.store": {"forbidden": "Boletos", "required": "Entradas"},
    "boletosfifa.store": {"forbidden": "Entradas", "required": "Boletos"}
}

def audit_page(file_path, domain):
    with open(file_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")
    
    score = 100
    issues = []
    
    # --- 1. Structural Integrity ---
    # Check for Luxury Components
    luxury_components = {
        ".match-score-card": "Match Score Card",
        ".btn-gold": "Gold Action Button",
        ".seo-content-block": "SEO Content Block",
        ".hero": "Hero Section"
    }
    for selector, name in luxury_components.items():
        if not soup.select(selector):
            score -= 15
            issues.append(f"MISSING: {name} {selector}")

    # --- 2. Placeholder Detection (Critical) ---
    body_text = soup.get_text()
    placeholders = ["HOME", "AWAY", "TBD", "[", "]"]
    for p in placeholders:
        if p in body_text:
            score -= 30
            issues.append(f"CRITICAL: Placeholder {p} found in text")

    # --- 3. SEO Validation ---
    h1s = soup.find_all("h1")
    if len(h1s) != 1:
        score -= 10
        issues.append(f"SEO: Found {len(h1s)} H1 tags (Expected 1)")
    
    if not soup.find("meta", attrs={"name": "description"}):
        score -= 10
        issues.append("SEO: Missing meta description")
        
    if not soup.find("meta", attrs={"name": "viewport"}):
        score -= 10
        issues.append("TECH: Missing viewport meta")

    # --- 4. Domain Integrity ---
    specs = DOMAINS[domain]
    if specs["forbidden"] in body_text:
        score -= 20
        issues.append(f"DOMAIN: Forbidden word {specs['forbidden']} found on {domain}")
    if specs["required"] not in body_text:
        score -= 10
        issues.append(f"DOMAIN: Required word {specs['required']} missing on {domain}")

    return max(0, score), issues

print("🏆 LUXURY LAYOUT SUITE STARTING...\n")
overall_stats = {"total_pages": 0, "perfect_pages": 0, "critical_fails": 0}

for domain in DOMAINS:
    print(f"\n📂 Auditing Domain: {domain}")
    print("=" * 50)
    files = glob.glob(f"{ROOT_DIR}/{domain}/**/index.html", recursive=True)
    for file in files:
        overall_stats["total_pages"] += 1
        score, issues = audit_page(file, domain)
        
        status = "💎 PERFECT" if score == 100 else "⚠️ NEEDS WORK"
        if score < 60: status = "❌ CRITICAL"
        
        if score == 100: overall_stats["perfect_pages"] += 1
        if score < 60: overall_stats["critical_fails"] += 1
        
        print(f"[{status}] {score}% | {file.split('/')[-3] if '/' in file else file}")
        for issue in issues:
            print(f"   └─ {issue}")
            
print("\n" + "=" * 50)
print(f"FINAL REPORT:")
print(f"Total Pages Analyzed: {overall_stats['total_pages']}")
print(f"Perfect Pages: {overall_stats['perfect_pages']}")
print(f"Critical Failures: {overall_stats['critical_fails']}")
print(f"Project Health: {(overall_stats['perfect_pages']/overall_stats['total_pages']*100):.1f}%")
print("=" * 50)
