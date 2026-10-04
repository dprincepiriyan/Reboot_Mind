import os
import subprocess
import markdown

def convert_md_to_pdf(md_path, pdf_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    html_body = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code', 'nl2br', 'sane_lists']
    )

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PROJECT REPORT: MAD (MUTUAL ADDICTION DEFEAT)</title>
<style>
    @page {{
        size: A4;
        margin: 25mm 20mm 25mm 20mm;
        @top-right {{
            content: "Chennai Institute of Technology — Dept. of CSE — MAD PBL Report";
            font-family: 'Times New Roman', serif;
            font-size: 9pt;
            color: #555;
            font-style: italic;
        }}
        @bottom-center {{
            content: counter(page);
            font-family: 'Times New Roman', serif;
            font-size: 10pt;
        }}
    }}

    body {{
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #111;
        text-align: justify;
        margin: 0;
        padding: 0;
    }}

    .header-banner {{
        text-align: right;
        font-size: 9pt;
        color: #555;
        font-style: italic;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
        margin-bottom: 20px;
    }}

    h1 {{
        font-size: 16pt;
        font-weight: bold;
        text-transform: uppercase;
        text-align: center;
        margin-top: 35px;
        margin-bottom: 20px;
        page-break-before: always;
        color: #000;
        border-bottom: 2px solid #333;
        padding-bottom: 8px;
    }}

    h1:first-of-type {{
        page-break-before: avoid;
    }}

    h2 {{
        font-size: 13pt;
        font-weight: bold;
        margin-top: 22px;
        margin-bottom: 10px;
        color: #111;
    }}

    h3 {{
        font-size: 12pt;
        font-weight: bold;
        margin-top: 16px;
        margin-bottom: 8px;
        color: #222;
    }}

    p {{
        margin-top: 0;
        margin-bottom: 12px;
        text-indent: 0;
    }}

    table {{
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
        margin-bottom: 20px;
        font-size: 10.5pt;
        page-break-inside: auto;
    }}

    tr {{
        page-break-inside: avoid;
        page-break-after: auto;
    }}

    th, td {{
        border: 1px solid #333;
        padding: 7px 9px;
        vertical-align: top;
    }}

    th {{
        background-color: #f2f2f2;
        font-weight: bold;
        text-align: left;
    }}

    pre {{
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 12px;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 9.5pt;
        line-height: 1.4;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin-top: 14px;
        margin-bottom: 16px;
        page-break-inside: avoid;
    }}

    code {{
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 10pt;
        background-color: #f0f0f0;
        padding: 2px 4px;
        border-radius: 3px;
    }}

    pre code {{
        background-color: transparent;
        padding: 0;
    }}

    ul, ol {{
        margin-top: 6px;
        margin-bottom: 12px;
        padding-left: 28px;
    }}

    li {{
        margin-bottom: 6px;
    }}

    hr {{
        border: 0;
        border-top: 1px solid #aaa;
        margin: 24px 0;
    }}

    blockquote {{
        border-left: 4px solid #10b981;
        margin: 16px 0;
        padding: 8px 16px;
        background-color: #f0fdf4;
        color: #1f2937;
        font-style: italic;
    }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

    html_path = md_path.replace('.md', '.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
    print(f"Generated HTML: {html_path}")

    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_exe):
        edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

    cmd = [
        edge_exe,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    
    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"Successfully generated PDF: {pdf_path} ({size_kb:.1f} KB)")
        return True
    else:
        print(f"Error generating PDF: {result.stderr}")
        return False

if __name__ == "__main__":
    md_file = r"d:\2026_project\MAD\PROJECT_REPORT.md"
    pdf_file = r"d:\2026_project\MAD\PROJECT_REPORT.pdf"
    convert_md_to_pdf(md_file, pdf_file)
