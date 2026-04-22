import pdfplumber
import json
import os

PDF = "/Users/karim/Desktop/Traction Learning/_OceanofPDF.com_Traction_-_Gabriel_Weinberg_and_Justin_Mares.pdf"
OUT = "/tmp/traction-chapters"

# From PDF outline, page ranges (0-indexed). Each tuple: (num, slug, title, start_page, end_page_exclusive)
CHAPTERS = [
    (3,  "traction-thinking",         "Traction Thinking",            20, 31),
    (4,  "traction-testing",          "Traction Testing",             31, 37),
    (5,  "critical-path",             "Critical Path",                37, 47),
    (6,  "viral-marketing",           "Viral Marketing",              47, 59),
    (7,  "public-relations",          "Public Relations (PR)",        59, 69),
    (8,  "unconventional-pr",         "Unconventional PR",            69, 81),
    (9,  "sem",                       "Search Engine Marketing",      81, 91),
    (10, "social-display-ads",        "Social & Display Ads",         91, 101),
    (11, "offline-ads",               "Offline Ads",                  101, 113),
    (12, "seo",                       "Search Engine Optimization",   113, 125),
    (13, "content-marketing",         "Content Marketing",            125, 133),
    (14, "email-marketing",           "Email Marketing",              133, 142),
    (15, "engineering-as-marketing",  "Engineering as Marketing",     142, 150),
    (16, "targeting-blogs",           "Targeting Blogs",              150, 156),
    (17, "business-development",      "Business Development (BD)",    156, 166),
    (18, "sales",                     "Sales",                        166, 178),
    (19, "affiliate-programs",        "Affiliate Programs",           178, 187),
    (20, "existing-platforms",        "Existing Platforms",           187, 196),
    (21, "trade-shows",               "Trade Shows",                  196, 204),
    (22, "offline-events",            "Offline Events",               204, 212),
    (23, "speaking-engagements",      "Speaking Engagements",         212, 219),
    (24, "community-building",        "Community Building",           219, 226),
]

summary = []
with pdfplumber.open(PDF) as pdf:
    for num, slug, title, start, end in CHAPTERS:
        pages_text = []
        for i in range(start, end):
            t = pdf.pages[i].extract_text() or ""
            pages_text.append(t)
        full = "\n\n".join(pages_text)
        words = len(full.split())
        path = os.path.join(OUT, f"ch{num:02d}-{slug}.txt")
        with open(path, "w") as f:
            f.write(f"# Chapter {num}: {title}\n# PDF pages {start}-{end-1}\n# Approx {words} words\n\n")
            f.write(full)
        summary.append({"num": num, "slug": slug, "title": title, "pages": f"{start}-{end-1}", "words": words, "path": path})

print(json.dumps(summary, indent=2))
