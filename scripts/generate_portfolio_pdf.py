import os
import base64
import subprocess
import shutil
import re
from pathlib import Path

# Paths
BASE_DIR = Path(r"C:\Users\waiya\Downloads\TeddyQyuonPortfolio")
IMG_DIR = BASE_DIR / "src" / "assets" / "images"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# Target outputs
OUT_PDF_CLEAN = Path(r"C:\Users\waiya\Downloads\Wai_Yan_Hpone_Lat_Portfolio.pdf")
OUT_PDF_ORIG = Path(r"C:\Users\waiya\Downloads\Wai_Yan_Hpone_Lat_Technical_Portfolio.pdf")
OUT_PDF_WORKSPACE = Path(r"C:\Users\waiya\Downloads\GameValut\docs\Wai_Yan_Hpone_Lat_Portfolio.pdf")
OUT_HTML = Path(r"C:\Users\waiya\Downloads\GameValut\docs\portfolio_template.html")

def img_to_b64(path):
    if not os.path.exists(path):
        print(f"Warning: Missing image {path}")
        return ""
    mime = "image/png" if str(path).lower().endswith(".png") else "image/jpeg"
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{data}"

# Load images
nyp_logo = img_to_b64(IMG_DIR / "nyp_logo.png")
gamevault_img = img_to_b64(IMG_DIR / "projects" / "gamevault" / "gamevault-home.jpg")
gamevault_product_img = img_to_b64(IMG_DIR / "projects" / "gamevault" / "gamevault-product.jpg")
mobile_coder_img = img_to_b64(IMG_DIR / "projects" / "antigravity-mobile-coder.png")
sole_district_img = img_to_b64(IMG_DIR / "projects" / "uiux-sole-storefront.jpg")
scenthaus_img = img_to_b64(IMG_DIR / "projects" / "scenthaus" / "storefront-verified.jpg")
meterwise_img = img_to_b64(IMG_DIR / "projects" / "uiux-meterwise-overview.jpg")
playlist_port_img = img_to_b64(IMG_DIR / "projects" / "playlist-port-live-home.jpg")
annual_leave_img = img_to_b64(IMG_DIR / "projects" / "annual-leave" / "sign-in-rbac.png")
gym_calories_img = img_to_b64(IMG_DIR / "projects" / "gym-calories-predictive-analysis" / "model-comparison.png")

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Wai Yan Hpone Lat (Teddy) — Technical Project Portfolio</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
  }}
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.45;
    font-size: 8.5pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  a {{
    color: #2563eb;
    text-decoration: none;
    font-weight: 600;
  }}

  /* Exact A4 Page Container */
  .page {{
    width: 100%;
    height: 277mm;
    max-height: 277mm;
    overflow: hidden;
    position: relative;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .page:last-child {{
    page-break-after: avoid;
    break-after: avoid;
  }}

  .content-body {{
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }}

  /* Page Footer */
  .page-footer {{
    height: 8mm;
    border-top: 1px solid #cbd5e1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.2pt;
    color: #64748b;
    margin-top: 4px;
  }}
  .page-footer strong {{
    color: #0f172a;
  }}

  /* Header Section */
  .header-card {{
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }}
  .header-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .candidate-title {{
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    line-height: 1.1;
  }}
  .candidate-subtitle {{
    font-size: 9pt;
    font-weight: 700;
    color: #2563eb;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }}
  .institution-badge {{
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 7.5pt;
    text-align: right;
  }}
  .nyp-logo-img {{
    height: 26px;
    object-fit: contain;
  }}
  .contact-bar {{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 7px;
    font-size: 7.8pt;
    color: #475569;
    padding: 5px 9px;
    background: #f1f5f9;
    border-radius: 4px;
  }}
  .contact-item {{
    display: flex;
    align-items: center;
    gap: 3px;
  }}
  .contact-item strong {{
    color: #0f172a;
  }}

  /* Section Headings */
  .section-title {{
    font-size: 9.8pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 3px;
    margin-top: 10px;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .section-title .badge {{
    font-size: 6.8pt;
    font-weight: 700;
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
    padding: 1.5px 6px;
    border-radius: 3px;
    text-transform: none;
    letter-spacing: 0;
  }}

  /* Objective Callout Box */
  .objective-box {{
    background: #f0fdf4;
    border-left: 3.5px solid #16a34a;
    padding: 7px 10px;
    border-radius: 0 5px 5px 0;
    margin-bottom: 8px;
    font-size: 8pt;
    color: #166534;
    line-height: 1.35;
  }}
  .objective-box strong {{
    color: #14532d;
  }}

  /* Skills Grid */
  .skills-container {{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 8px;
  }}
  .skill-group {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 6px 8px;
  }}
  .skill-group-title {{
    font-size: 7.8pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 3.5px;
  }}
  .skill-tags {{
    display: flex;
    flex-wrap: wrap;
    gap: 3.5px;
  }}
  .tag {{
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-size: 6.8pt;
    font-weight: 500;
    padding: 1px 4.5px;
    border-radius: 3px;
  }}
  .tag.highlight {{
    background: #dbeafe;
    border-color: #93c5fd;
    color: #1e40af;
    font-weight: 700;
  }}
  .tag.success {{
    background: #dcfce7;
    border-color: #86efac;
    color: #15803d;
    font-weight: 700;
  }}

  /* Table styling */
  .clean-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 7.6pt;
    margin-top: 4px;
    margin-bottom: 6px;
  }}
  .clean-table th {{
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    text-align: left;
    padding: 4px 6px;
    border: 1px solid #cbd5e1;
    font-size: 7.2pt;
  }}
  .clean-table td {{
    padding: 4px 6px;
    border: 1px solid #e2e8f0;
    color: #334155;
  }}
  .clean-table tr:nth-child(even) {{
    background: #f8fafc;
  }}

  /* Project Card Full Page */
  .flagship-card {{
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    padding: 10px;
    margin-bottom: 8px;
  }}
  .flagship-header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    margin-bottom: 8px;
  }}
  .flagship-title {{
    font-size: 12.5pt;
    font-weight: 800;
    color: #0f172a;
  }}
  .flagship-subtitle {{
    font-size: 8pt;
    color: #475569;
    font-weight: 600;
    margin-top: 2px;
  }}
  .pill-link {{
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #ffffff;
    border: 1px solid #94a3b8;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 7.2pt;
    font-weight: 700;
  }}
  .pill-link.primary {{
    background: #2563eb;
    border-color: #2563eb;
    color: #ffffff;
  }}

  .flagship-grid {{
    display: grid;
    grid-template-columns: 1.25fr 0.95fr;
    gap: 12px;
  }}
  .feature-list {{
    list-style: none;
    margin: 4px 0;
  }}
  .feature-list li {{
    position: relative;
    padding-left: 11px;
    margin-bottom: 4px;
    font-size: 7.8pt;
    line-height: 1.35;
    color: #334155;
  }}
  .feature-list li::before {{
    content: "■";
    position: absolute;
    left: 0;
    color: #2563eb;
    font-size: 5.5pt;
    top: 2px;
  }}
  .stat-badge-strip {{
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 6px 0;
  }}
  .stat-badge {{
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 2.5px 6px;
    font-size: 7pt;
    color: #1e293b;
  }}
  .stat-badge strong {{
    color: #0f172a;
  }}
  .flagship-img {{
    width: 100%;
    height: 175px;
    object-fit: cover;
    object-position: top;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
  }}
  .img-caption {{
    font-size: 6.8pt;
    color: #64748b;
    margin-top: 3px;
    line-height: 1.2;
    font-style: italic;
  }}

  /* Architecture Box */
  .arch-box {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 6px 8px;
    margin-top: 8px;
  }}
  .arch-box-title {{
    font-size: 7.5pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 3px;
  }}
  .flow-diagram {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ffffff;
    border: 1px dashed #94a3b8;
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 6.8pt;
    color: #0f172a;
    font-weight: 600;
    text-align: center;
    margin-top: 4px;
  }}
  .flow-arrow {{
    color: #2563eb;
    font-size: 8pt;
  }}

  /* 4-Project Grid on Page 4 */
  .four-projects-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 8px;
    flex: 1;
    margin-top: 4px;
  }}
  .grid-project-card {{
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
    padding: 9px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .grid-project-header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
  }}
  .grid-project-title {{
    font-size: 9.8pt;
    font-weight: 800;
    color: #0f172a;
  }}
  .grid-project-subtitle {{
    font-size: 6.8pt;
    color: #64748b;
  }}
  .grid-project-img {{
    width: 100%;
    height: 98px;
    object-fit: cover;
    object-position: top;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    margin-top: 3px;
    margin-bottom: 4px;
  }}

  /* Academic & Credential Cards */
  .academic-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 6px;
  }}
  .academic-header {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
  }}
  .academic-title {{
    font-size: 8.8pt;
    font-weight: 800;
    color: #0f172a;
  }}
  .academic-meta {{
    font-size: 7.2pt;
    color: #64748b;
  }}

  /* Why Hire Grid */
  .why-hire-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-top: 6px;
  }}
  .why-hire-item {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 6px 8px;
  }}
  .why-hire-item strong {{
    font-size: 7.5pt;
    color: #0f172a;
    display: block;
    margin-bottom: 2px;
  }}
  .why-hire-item p {{
    font-size: 7pt;
    color: #475569;
    line-height: 1.3;
  }}

  .cta-banner {{
    background: #0f172a;
    color: #ffffff;
    border-radius: 5px;
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }}
</style>
</head>
<body>

<!-- ==================== PAGE 1: PROFILE & SKILLS MATRIX ==================== -->
<div class="page">
  <div class="content-body">
    <div class="header-card">
      <div class="header-top">
        <div>
          <h1 class="candidate-title">WAI YAN HPONE LAT (TEDDY)</h1>
          <div class="candidate-subtitle">Applied AI &amp; Analytics Student &bull; Full-Stack &amp; Software Engineering Intern Candidate</div>
        </div>
        <div class="institution-badge">
          <img src="{nyp_logo}" alt="NYP Logo" class="nyp-logo-img">
          <div>
            <strong>Nanyang Polytechnic</strong><br>
            School of Applied Science &amp; InfoTech
          </div>
        </div>
      </div>
      
      <div class="contact-bar">
        <div class="contact-item"><strong>Location:</strong> Singapore</div>
        <div class="contact-item"><strong>Email:</strong> <a href="mailto:waiyanhponelat.eduvalor.2024g@gmail.com">waiyanhponelat.eduvalor.2024g@gmail.com</a></div>
        <div class="contact-item"><strong>Phone:</strong> +65 9897 4250</div>
        <div class="contact-item"><strong>Portfolio:</strong> <a href="https://teddy-qyuon-portfolio.vercel.app">teddy-qyuon-portfolio.vercel.app</a></div>
        <div class="contact-item"><strong>GitHub:</strong> <a href="https://github.com/TeddyQyuon">github.com/TeddyQyuon</a></div>
        <div class="contact-item"><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/waiyanhponelat">linkedin.com/in/waiyanhponelat</a></div>
      </div>
    </div>

    <div class="objective-box">
      <strong>🎯 Full 44-Week Technology Internship (29 March 2027 – 28 January 2028):</strong><br>
      Year 2 Applied AI &amp; Analytics student at Nanyang Polytechnic seeking a full-stack software engineering or applied data/AI internship. Proven track record architecting production-deployed React applications, Python and Node.js REST APIs, relational schemas with strict ACID integrity, and machine learning pipelines. Every project is verified with automated tests, cryptographic payment protection, and public cloud deployments.
    </div>

    <div class="section-title">
      <span>Core Technical Capabilities</span>
      <span class="badge">100+ Automated Tests Passing</span>
    </div>

    <div class="skills-container">
      <div class="skill-group">
        <div class="skill-group-title">💻 Frontend &amp; Mobile Architecture</div>
        <div class="skill-tags">
          <span class="tag highlight">React 18 / 19</span>
          <span class="tag highlight">Vite</span>
          <span class="tag highlight">TypeScript</span>
          <span class="tag highlight">Tailwind CSS</span>
          <span class="tag">PWA &amp; Service Workers</span>
          <span class="tag">Web Speech API</span>
          <span class="tag">Responsive UI/UX</span>
          <span class="tag">State Management</span>
        </div>
      </div>

      <div class="skill-group">
        <div class="skill-group-title">⚙️ Backend, Serverless &amp; Cloud APIs</div>
        <div class="skill-tags">
          <span class="tag highlight">Node.js</span>
          <span class="tag highlight">Express.js</span>
          <span class="tag highlight">Python 3.12</span>
          <span class="tag highlight">FastAPI</span>
          <span class="tag highlight">Django REST</span>
          <span class="tag">Vercel Serverless</span>
          <span class="tag">RESTful Architecture</span>
          <span class="tag">OAuth 2.0 PKCE</span>
        </div>
      </div>

      <div class="skill-group">
        <div class="skill-group-title">🗄️ Relational Databases &amp; Security</div>
        <div class="skill-tags">
          <span class="tag highlight">PostgreSQL (Neon)</span>
          <span class="tag highlight">MySQL</span>
          <span class="tag highlight">Sequelize ORM</span>
          <span class="tag">SQLAlchemy</span>
          <span class="tag">SQLite</span>
          <span class="tag highlight">Row-Level Locks</span>
          <span class="tag">SSRF Hardening</span>
          <span class="tag">CSRF &amp; JWT Auth</span>
          <span class="tag">RBAC</span>
        </div>
      </div>

      <div class="skill-group">
        <div class="skill-group-title">🤖 Applied AI, ML &amp; Analytics</div>
        <div class="skill-tags">
          <span class="tag highlight">Google Gemini API</span>
          <span class="tag highlight">scikit-learn</span>
          <span class="tag highlight">pandas / NumPy</span>
          <span class="tag">MLflow</span>
          <span class="tag">LightGBM</span>
          <span class="tag">KNIME Analytics</span>
          <span class="tag">SAS Viya</span>
          <span class="tag">Demand Forecasting</span>
        </div>
      </div>

      <div class="skill-group" style="grid-column: span 2;">
        <div class="skill-group-title">🚀 Payments, DevOps &amp; Engineering Rigor</div>
        <div class="skill-tags">
          <span class="tag highlight">Stripe Checkout &amp; Elements</span>
          <span class="tag highlight">Signature-Verified Webhooks</span>
          <span class="tag highlight">Idempotent Event Ledgers</span>
          <span class="tag">Git &amp; GitHub Actions</span>
          <span class="tag">Vercel Cloud Hosting</span>
          <span class="tag">Node Test Runner / Vitest / Pytest</span>
          <span class="tag">Postman</span>
          <span class="tag">Zero Regressions Protocol</span>
        </div>
      </div>
    </div>

    <div class="section-title">
      <span>Verified Engineering Projects Directory</span>
      <span class="badge">Live Deployments &amp; Public Source</span>
    </div>

    <table class="clean-table">
      <thead>
        <tr>
          <th style="width: 22%;">Project Name</th>
          <th style="width: 27%;">Core Technologies</th>
          <th style="width: 35%;">Key Architectural Innovation</th>
          <th style="width: 16%;">Verified Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>GameVault</strong></td>
          <td>React 18, Express, MySQL, Stripe, Vercel</td>
          <td>Server-owned pricing, idempotent webhooks, cart drawer</td>
          <td><a href="https://gamevault-alpha-ten.vercel.app">Live Storefront</a></td>
        </tr>
        <tr>
          <td><strong>Antigravity Mobile Coder</strong></td>
          <td>React PWA, Gemini API, Voice Speech, Node</td>
          <td>Voice-driven PWA, self-healing test loops, multi-key pool</td>
          <td><a href="https://antigravity-mobile-coder.vercel.app">Live PWA App</a></td>
        </tr>
        <tr>
          <td><strong>SOLE DISTRICT</strong></td>
          <td>React 19, Django, PostgreSQL, Stripe</td>
          <td>Row-level SKU stock locking, AI styling assistant, Neon DB</td>
          <td><a href="https://sole-district-green.vercel.app">Live Storefront</a></td>
        </tr>
        <tr>
          <td><strong>SCENTHAUS Intelligence</strong></td>
          <td>FastAPI, scikit-learn, MLflow, Stripe</td>
          <td>Content-based scent cosine similarity &amp; demand forecasting</td>
          <td><a href="https://teddy-qyuon-portfolio.vercel.app/#projects">Verified System</a></td>
        </tr>
        <tr>
          <td><strong>MeterWise</strong></td>
          <td>TypeScript, FastAPI, LightGBM, Recharts</td>
          <td>Singapore HDB estate energy analytics &amp; anomaly detection</td>
          <td><a href="https://teddy-qyuon-portfolio.vercel.app/#projects">Verified System</a></td>
        </tr>
        <tr>
          <td><strong>Playlist Port</strong></td>
          <td>Node.js, Express, Spotify Web API, OAuth 2</td>
          <td>OAuth 2.0 PKCE, server-held tokens, paginated track cloning</td>
          <td><a href="https://teddy-qyuon-portfolio.vercel.app/#projects">Verified System</a></td>
        </tr>
      </tbody>
    </table>

    <div style="background: #faf5ff; border-left: 3px solid #9333ea; padding: 6px 10px; border-radius: 0 4px 4px 0; margin-top: 8px; font-size: 7.6pt; color: #581c87;">
      <strong>💡 Engineering Integrity:</strong> All featured software is strictly verifiable via public repositories, comprehensive automated test suites, cryptographic boundary protection, and live URLs.
    </div>
  </div>

  <div class="page-footer">
    <span>Wai Yan Hpone Lat &bull; Nanyang Polytechnic (DAAA)</span>
    <span>Technical Project Portfolio &bull; Page 1 of 5</span>
    <span><a href="https://teddy-qyuon-portfolio.vercel.app">teddy-qyuon-portfolio.vercel.app</a></span>
  </div>
</div>

<!-- ==================== PAGE 2: FLAGSHIP PROJECT 01 (GAMEVAULT) ==================== -->
<div class="page">
  <div class="content-body">
    <div class="section-title">
      <span>Flagship Project 01 &bull; Full-Stack Digital Commerce</span>
      <span class="badge">Deployed &bull; 76 Automated Tests Passing</span>
    </div>

    <div class="flagship-card">
      <div class="flagship-header">
        <div>
          <div class="flagship-title">GameVault — Digital Game Subscriptions &amp; Gift Cards Marketplace</div>
          <div class="flagship-subtitle">React 18 &bull; Node.js &bull; Express.js &bull; MySQL &bull; Sequelize ORM &bull; Stripe Checkout &bull; Vercel Serverless</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <a href="https://gamevault-alpha-ten.vercel.app/" class="pill-link primary">🔗 Live Storefront</a>
          <a href="https://github.com/TeddyQyuon/gamevault" class="pill-link">📦 GitHub Repo</a>
        </div>
      </div>

      <div class="flagship-grid">
        <div>
          <p style="font-size: 8.2pt; color: #1e293b; line-height: 1.35; margin-bottom: 6px;">
            <strong>System Overview:</strong> GameVault is a production-deployed digital gaming marketplace featuring 37 verified products across 15 game subscriptions (Xbox Game Pass, PlayStation Plus, Nintendo Switch Online, EA Play), 8 digital gift cards, and 14 digital games. Engineered with an interactive sliding cart drawer, real-time promo discount math (<code style="background:#e2e8f0; padding:1px 3px; font-size:7pt;">GAMER10</code>), server-authoritative pricing, cryptographic Stripe webhook verification, and a staff fulfillment queue.
          </p>

          <div class="stat-badge-strip">
            <div class="stat-badge"><strong>76/76</strong> Automated Tests</div>
            <div class="stat-badge"><strong>37</strong> Products Live</div>
            <div class="stat-badge"><strong>Zero</strong> Client Price Tampering</div>
            <div class="stat-badge"><strong>&lt; 2.4s</strong> Production Build</div>
          </div>

          <p style="font-size: 8pt; font-weight: 700; color: #0f172a; margin-top: 6px;">Core Architectural Innovations:</p>
          <ul class="feature-list">
            <li><strong>Server-Authoritative Price Validation:</strong> Protects against browser client tampering. Cart items, quantities, and discounts are recomputed server-side from MySQL records before initiating Stripe Checkout sessions.</li>
            <li><strong>Interactive Sliding Cart Drawer:</strong> Features quantity clamps (1..5), instant subtotal updates, dynamic promo code evaluation, and seamless outside-click dismissal.</li>
            <li><strong>Cryptographic Stripe Webhook Pipeline:</strong> Signature-verified webhook processing with an idempotent ledger table preventing duplicate order fulfillments on Stripe event replays.</li>
            <li><strong>Staff 1-Hour Manual Fulfillment Queue:</strong> Dedicated operations queue for email delivery of digital codes, tracking customer contacts, regional variants, and completion timestamps.</li>
            <li><strong>Edge Serverless Functions:</strong> Deployed high-throughput Vercel edge endpoints (<code style="font-size:7pt;">/api/checkout/sessions</code>, <code style="font-size:7pt;">/api/promos/validate</code>, <code style="font-size:7pt;">/api/health</code>).</li>
          </ul>
        </div>

        <div>
          <img src="{gamevault_img}" alt="GameVault Storefront" class="flagship-img">
          <div class="img-caption">Figure 1.1: Live GameVault storefront on Vercel displaying verified subscription services, direct brand-tile routing, and curated deals.</div>

          <div class="arch-box">
            <div class="arch-box-title">Security &amp; Concurrency Safeguards:</div>
            <p style="font-size: 7.2pt; color: #475569; line-height: 1.3;">
              &bull; Strict anti-tampering guards reject live checkout creation for unstocked or demo listings.<br>
              &bull; 56 backend tests verify SQL transactions, token expiration, and CSRF defense headers.<br>
              &bull; 20 frontend tests verify promo code calculations, cart bounds, and route deduplication.
            </p>
          </div>
        </div>
      </div>

      <div class="arch-box" style="margin-top: 8px;">
        <div class="arch-box-title">End-to-End System Architecture &amp; Transaction Lifecycle:</div>
        <div class="flow-diagram">
          <span>Client UI (React 18 + Cart Drawer)</span>
          <span class="flow-arrow">&rarr;</span>
          <span>Vercel Serverless (/api/checkout)</span>
          <span class="flow-arrow">&rarr;</span>
          <span>Stripe Hosted Checkout</span>
          <span class="flow-arrow">&rarr;</span>
          <span>Signed Webhook (Idempotent Ledger)</span>
          <span class="flow-arrow">&rarr;</span>
          <span>Staff Fulfillment Queue</span>
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>Wai Yan Hpone Lat &bull; Nanyang Polytechnic (DAAA)</span>
    <span>Technical Project Portfolio &bull; Page 2 of 5</span>
    <span><a href="https://teddy-qyuon-portfolio.vercel.app">teddy-qyuon-portfolio.vercel.app</a></span>
  </div>
</div>

<!-- ==================== PAGE 3: FLAGSHIP PROJECT 02 (ANTIGRAVITY MOBILE CODER) ==================== -->
<div class="page">
  <div class="content-body">
    <div class="section-title">
      <span>Flagship Project 02 &bull; Autonomous AI &amp; Cloud Automation</span>
      <span class="badge">Deployed &bull; 22 Automated Tests Passing</span>
    </div>

    <div class="flagship-card">
      <div class="flagship-header">
        <div>
          <div class="flagship-title">Antigravity Mobile Coder — Autonomous Mobile Engineering PWA</div>
          <div class="flagship-subtitle">React &bull; Progressive Web App (PWA) &bull; Google Gemini Interactions API &bull; Web Speech API &bull; Vercel Edge</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <a href="https://antigravity-mobile-coder.vercel.app/" class="pill-link primary">🔗 Live PWA App</a>
          <a href="https://github.com/TeddyQyuon/antigravity-mobile-coder" class="pill-link">📦 GitHub Repo</a>
        </div>
      </div>

      <div class="flagship-grid">
        <div>
          <p style="font-size: 8.2pt; color: #1e293b; line-height: 1.35; margin-bottom: 6px;">
            <strong>System Overview:</strong> Antigravity Mobile Coder is an installable Progressive Web App (PWA) that frees software engineers from desktop workstations. Developers command autonomous AI coding workflows from mobile phones using one-tap voice dictation, multi-key Google Gemini API pools, self-healing test execution loops, and SSRF-hardened cloud browser engines.
          </p>

          <div class="stat-badge-strip">
            <div class="stat-badge"><strong>22/22</strong> Automated Tests</div>
            <div class="stat-badge"><strong>100%</strong> Mobile PWA Score</div>
            <div class="stat-badge"><strong>Multi-Account</strong> Key Pool</div>
            <div class="stat-badge"><strong>SSRF</strong> Cloud Defense</div>
          </div>

          <p style="font-size: 8pt; font-weight: 700; color: #0f172a; margin-top: 6px;">Core Architectural Innovations:</p>
          <ul class="feature-list">
            <li><strong>Hands-Free Web Speech API Voice Dictation:</strong> Captures developer intent naturally on mobile, appending dictated instructions without overwriting drafts or triggering keyboard auto-zoom.</li>
            <li><strong>Automated Multi-Key Rotation Pool:</strong> Automatically detects HTTP 429 rate limits across pooled Google Gemini accounts, switching active keys instantly with live quota tracking.</li>
            <li><strong>Self-Healing Autonomous Test Loops:</strong> Dispatches code generation into isolated sandboxes, executing <code style="font-size:7pt;">npm test</code> and <code style="font-size:7pt;">npm run build</code> repeatedly until exit code 0 is achieved.</li>
            <li><strong>Cloud Browser Engine &amp; Session Vault:</strong> Hardened serverless proxy with SSRF protection blocking loopback (<code style="font-size:7pt;">127.0.0.1</code>) and cloud metadata (<code style="font-size:7pt;">169.254.169.254</code>) IPs.</li>
            <li><strong>Laptop-Offline Cloud Dispatch:</strong> Dispatches mobile-initiated issues directly to cloud runners even when developer workstations are powered off.</li>
          </ul>
        </div>

        <div>
          <img src="{mobile_coder_img}" alt="Antigravity Mobile Coder PWA" class="flagship-img">
          <div class="img-caption">Figure 1.2: Antigravity Mobile Coder live PWA dashboard with voice dictation, repository presets, quota tracking, and live terminal output.</div>

          <div class="arch-box">
            <div class="arch-box-title">PWA &amp; Engineering Quality Metrics:</div>
            <p style="font-size: 7.2pt; color: #475569; line-height: 1.3;">
              &bull; 22 unit &amp; integration tests verifying PWA manifest shortcuts, offline caching, and SSRF.<br>
              &bull; Service Worker precaches core application shells for immediate launch.<br>
              &bull; Clean Vite production build in under 3 seconds; zero external tracking libraries.
            </p>
          </div>
        </div>
      </div>

      <div class="arch-box" style="margin-top: 8px;">
        <div class="arch-box-title">Autonomous Mobile Engineering Execution Pipeline:</div>
        <div class="flow-diagram">
          <span>Mobile Voice Prompt (Web Speech)</span>
          <span class="flow-arrow">&rarr;</span>
          <span>Gemini Interactions API Pool</span>
          <span class="flow-arrow">&rarr;</span>
          <span>Cloud Agent Sandbox Runner</span>
          <span class="flow-arrow">&rarr;</span>
          <span>Self-Healing (npm test / build)</span>
          <span class="flow-arrow">&rarr;</span>
          <span>Git Commit &amp; Vercel Deploy</span>
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>Wai Yan Hpone Lat &bull; Nanyang Polytechnic (DAAA)</span>
    <span>Technical Project Portfolio &bull; Page 3 of 5</span>
    <span><a href="https://teddy-qyuon-portfolio.vercel.app">teddy-qyuon-portfolio.vercel.app</a></span>
  </div>
</div>

<!-- ==================== PAGE 4: 4 FEATURED PROJECTS GRID ==================== -->
<div class="page">
  <div class="content-body">
    <div class="section-title">
      <span>High-Impact Engineering Projects 03, 04, 05 &amp; 06</span>
      <span class="badge">E-Commerce, Machine Learning &amp; Cloud Systems</span>
    </div>

    <div class="four-projects-grid">
      <!-- Project 3: SOLE DISTRICT -->
      <div class="grid-project-card">
        <div>
          <div class="grid-project-header">
            <div>
              <div class="grid-project-title">SOLE DISTRICT</div>
              <div class="grid-project-subtitle">Streetwear Commerce &amp; Django Workspace</div>
            </div>
            <a href="https://sole-district-green.vercel.app/" class="pill-link primary" style="font-size:6.8pt;">🔗 Live</a>
          </div>
          <img src="{sole_district_img}" alt="SOLE DISTRICT" class="grid-project-img">
          <p style="font-size: 7.4pt; color: #334155; line-height: 1.3;">
            An editorial streetwear commerce platform with a <strong>Python/Django REST API</strong> and dedicated <strong>Neon PostgreSQL</strong> database in Singapore. Built to solve size-level stock overselling.
          </p>
          <ul class="feature-list" style="margin-top: 3px;">
            <li><strong>PostgreSQL Row Locks:</strong> <code style="font-size:6.5pt;">select_for_update()</code> prevents concurrent overselling during checkout races.</li>
            <li><strong>Gemini 3.8 Flash Stylist:</strong> AI assistant providing personalized outfit styling advice.</li>
            <li><strong>42/42 Backend CI Tests:</strong> Verified on PostgreSQL 16 covering CSRF and role gates.</li>
          </ul>
        </div>
        <div class="skill-tags" style="margin-top: 4px;">
          <span class="tag highlight">React 19</span>
          <span class="tag highlight">Python</span>
          <span class="tag highlight">Django REST</span>
          <span class="tag highlight">PostgreSQL</span>
          <span class="tag">Stripe</span>
        </div>
      </div>

      <!-- Project 4: SCENTHAUS -->
      <div class="grid-project-card">
        <div>
          <div class="grid-project-header">
            <div>
              <div class="grid-project-title">SCENTHAUS Intelligence</div>
              <div class="grid-project-subtitle">Fragrance Discovery &amp; ML Recommendations</div>
            </div>
            <span class="pill-link" style="font-size:6.8pt; color:#475569;">Verified</span>
          </div>
          <img src="{scenthaus_img}" alt="SCENTHAUS" class="grid-project-img">
          <p style="font-size: 7.4pt; color: #334155; line-height: 1.3;">
            A luxury fragrance discovery platform with <strong>35 perfume houses and 150 items</strong>, combining a React frontend with a <strong>FastAPI</strong> ML recommendation pipeline.
          </p>
          <ul class="feature-list" style="margin-top: 3px;">
            <li><strong>Scent Note Vectorization:</strong> Cosine similarity recommendation engine over olfactive note profiles using <code style="font-size:6.5pt;">scikit-learn</code>.</li>
            <li><strong>Demand Forecasting ML:</strong> Seasonal demand forecasting models tracked with <code style="font-size:6.5pt;">MLflow</code>.</li>
            <li><strong>FastAPI Microservice:</strong> Asynchronous REST backend delivering sub-50ms responses.</li>
          </ul>
        </div>
        <div class="skill-tags" style="margin-top: 4px;">
          <span class="tag highlight">React</span>
          <span class="tag highlight">FastAPI</span>
          <span class="tag highlight">scikit-learn</span>
          <span class="tag highlight">MLflow</span>
          <span class="tag">PostgreSQL</span>
        </div>
      </div>

      <!-- Project 5: MeterWise -->
      <div class="grid-project-card">
        <div>
          <div class="grid-project-header">
            <div>
              <div class="grid-project-title">MeterWise</div>
              <div class="grid-project-subtitle">Smart Estate Energy &amp; Facilities Analytics</div>
            </div>
            <span class="pill-link" style="font-size:6.8pt; color:#475569;">Verified</span>
          </div>
          <img src="{meterwise_img}" alt="MeterWise" class="grid-project-img">
          <p style="font-size: 7.4pt; color: #334155; line-height: 1.3;">
            An IoT energy management dashboard built with <strong>React/TypeScript</strong> and <strong>FastAPI</strong>, utilizing public Singapore HDB estate data to monitor facility power usage.
          </p>
          <ul class="feature-list" style="margin-top: 3px;">
            <li><strong>LightGBM Anomaly Detection:</strong> ML models flag unexpected power surges and electrical faults.</li>
            <li><strong>Validated CSV Ingestion:</strong> Automated schema validation sanitizing smart-meter batch uploads.</li>
            <li><strong>Interactive Timeseries Charts:</strong> Built with Recharts with dynamic date-range downsampling.</li>
          </ul>
        </div>
        <div class="skill-tags" style="margin-top: 4px;">
          <span class="tag highlight">TypeScript</span>
          <span class="tag highlight">React</span>
          <span class="tag highlight">FastAPI</span>
          <span class="tag highlight">LightGBM</span>
          <span class="tag">SQL</span>
        </div>
      </div>

      <!-- Project 6: Playlist Port -->
      <div class="grid-project-card">
        <div>
          <div class="grid-project-header">
            <div>
              <div class="grid-project-title">Playlist Port</div>
              <div class="grid-project-subtitle">Spotify OAuth 2.0 Playlist Migration Utility</div>
            </div>
            <span class="pill-link" style="font-size:6.8pt; color:#475569;">Verified</span>
          </div>
          <img src="{playlist_port_img}" alt="Playlist Port" class="grid-project-img">
          <p style="font-size: 7.4pt; color: #334155; line-height: 1.3;">
            A full-stack utility enabling lossless playlist copying between Spotify accounts, solving API rate limits and token security issues through a secure server backend.
          </p>
          <ul class="feature-list" style="margin-top: 3px;">
            <li><strong>OAuth 2.0 PKCE Flow:</strong> Server-held refresh tokens stored in HttpOnly cookies, shielding client.</li>
            <li><strong>Paginated Batch Processing:</strong> Safely processes playlists with 1,000+ tracks via chunked recursive API pagination.</li>
            <li><strong>Deterministic Ordering:</strong> Guarantees original curation sequence remains intact.</li>
          </ul>
        </div>
        <div class="skill-tags" style="margin-top: 4px;">
          <span class="tag highlight">React</span>
          <span class="tag highlight">Node.js</span>
          <span class="tag highlight">Express.js</span>
          <span class="tag highlight">Spotify API</span>
          <span class="tag">OAuth 2.0</span>
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>Wai Yan Hpone Lat &bull; Nanyang Polytechnic (DAAA)</span>
    <span>Technical Project Portfolio &bull; Page 4 of 5</span>
    <span><a href="https://teddy-qyuon-portfolio.vercel.app">teddy-qyuon-portfolio.vercel.app</a></span>
  </div>
</div>

<!-- ==================== PAGE 5: ACADEMIC COURSEWORK & CREDENTIALS ==================== -->
<div class="page">
  <div class="content-body">
    <div class="section-title">
      <span>Nanyang Polytechnic Coursework Engineering</span>
      <span class="badge">Grade 'A' Coursework Project Showcases</span>
    </div>

    <!-- Coursework Project 1: Annual Leave -->
    <div class="academic-card" style="padding: 9px 11px; margin-bottom: 8px;">
      <div class="academic-header">
        <div>
          <div class="academic-title">Annual Leave Management System — Enterprise Full-Stack System</div>
          <div style="font-size: 7.3pt; color: #2563eb; font-weight: 600; margin-top: 1px;">
            Full Stack Application Development Module &bull; Grade: A &bull; Role: Full-Stack Contributor (Member 3)
          </div>
        </div>
        <span class="tag success" style="font-size: 7pt;">Module Grade: A</span>
      </div>
      <div style="display: grid; grid-template-columns: 1.35fr 0.65fr; gap: 9px; margin-top: 5px;">
        <div>
          <p style="font-size: 7.6pt; color: #334155; line-height: 1.34;">
            A multi-role enterprise web application engineered with strict Role-Based Access Control (RBAC), hierarchical multi-tier approvals, and leave balance deductions.
          </p>
          <ul class="feature-list" style="margin-top: 3px;">
            <li><strong>Supervisor-to-Manager Approval Chain:</strong> Implemented dynamic escalation routing applications based on organizational employee rank.</li>
            <li><strong>Atomic Quota Balance Deductions:</strong> Guaranteed deductions execute strictly upon final authorization, preventing negative balances.</li>
            <li><strong>Acting Approver &amp; Delegation Logic:</strong> Architected temporary proxy appointment system with full audit trails for managers on leave.</li>
            <li><strong>Duplicate Submission Guards:</strong> Built backend idempotency token guards preventing accidental double deductions caused by rapid client-side clicks.</li>
          </ul>
        </div>
        <div>
          <img src="{annual_leave_img}" alt="Annual Leave System" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;">
          <div class="img-caption" style="font-size:6.5pt;">Figure 3.1: RBAC Sign-in &amp; multi-role selection.</div>
          <div class="skill-tags" style="margin-top: 3px;">
            <span class="tag highlight">React</span>
            <span class="tag highlight">Express</span>
            <span class="tag highlight">Sequelize</span>
            <span class="tag">MySQL</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Coursework Project 2: Gym Calories -->
    <div class="academic-card" style="padding: 9px 11px; margin-bottom: 8px;">
      <div class="academic-header">
        <div>
          <div class="academic-title">Gym Calories Predictive Machine Learning Analysis</div>
          <div style="font-size: 7.3pt; color: #2563eb; font-weight: 600; margin-top: 1px;">
            Predictive Analytics &amp; Forecasting Module &bull; Grade: A &bull; Tooling: KNIME Analytics &amp; SAS Viya
          </div>
        </div>
        <span class="tag success" style="font-size: 7pt;">Module Grade: A</span>
      </div>
      <div style="display: grid; grid-template-columns: 1.35fr 0.65fr; gap: 9px; margin-top: 5px;">
        <div>
          <p style="font-size: 7.6pt; color: #334155; line-height: 1.34;">
            End-to-end predictive modeling project comparing linear and ensemble machine learning algorithms to predict caloric expenditure during cardiovascular and resistance training workouts.
          </p>
          <ul class="feature-list" style="margin-top: 3px;">
            <li><strong>Data Cleansing:</strong> Ingested 4,865 raw records; cleansed outliers and invalid heart-rate readings to produce 950 validated records.</li>
            <li><strong>Feature Engineering:</strong> Constructed interaction variables between Workout Intensity, Mean Heart Rate, and Session Duration.</li>
            <li><strong>Algorithm Benchmarking:</strong> Evaluated Linear Regression, Decision Trees, Random Forest, and Gradient Boosting on a standardized 70/30 train-test partition.</li>
            <li><strong>Model Selection:</strong> Gradient Boosting delivered superior predictive accuracy (lowest RMSE and highest R²), with Session Duration as the dominant driver.</li>
          </ul>
        </div>
        <div>
          <img src="{gym_calories_img}" alt="Model Comparison" style="width: 100%; height: 80px; object-fit: contain; background: #ffffff; border-radius: 4px; border: 1px solid #cbd5e1;">
          <div class="img-caption" style="font-size:6.5pt;">Figure 3.2: ML model comparison chart across splits.</div>
          <div class="skill-tags" style="margin-top: 3px;">
            <span class="tag highlight">KNIME</span>
            <span class="tag highlight">SAS Viya</span>
            <span class="tag highlight">Gradient Boosting</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Education Section -->
    <div class="section-title" style="margin-top: 6px;">
      <span>Education Journey &amp; Academic Distinctions</span>
      <span class="badge">Verified Academic Record</span>
    </div>

    <div class="academic-card" style="padding: 7px 10px; margin-bottom: 6px;">
      <div class="academic-header">
        <div class="academic-title">Nanyang Polytechnic (Singapore) — Diploma in Applied AI &amp; Analytics</div>
        <div class="academic-meta">2025 – Present (Expected May 2028)</div>
      </div>
      <div style="font-size: 7.6pt; font-weight: 700; color: #16a34a; margin-bottom: 2px;">
        Cumulative GPA: 3.18 / 4.00 &bull; Year 2 Semester 1 GPA: 3.70 (Distinction Standing)
      </div>
      <p style="font-size: 7.2pt; color: #475569; line-height: 1.3;">
        <strong>Key Coursework Highlights:</strong> Full Stack Application Development (Grade A), Predictive Analytics &amp; Forecasting (Grade A), Data Wrangling (Grade A), Data Structures &amp; Algorithms, Responsible AI for Sustainability, Database Administration, UX Design.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
      <div class="academic-card" style="margin-bottom: 0; padding: 6px 9px;">
        <div class="academic-header">
          <div class="academic-title" style="font-size:8.2pt;">Myanmar Matriculation Exam</div>
          <div class="academic-meta">2018 / 2019</div>
        </div>
        <div style="font-size: 7.4pt; font-weight: 700; color: #16a34a;">487 / 600 &bull; 5 Distinctions</div>
        <p style="font-size: 6.9pt; color: #64748b;">Distinctions in Mathematics, Chemistry, Physics, Biology, and Myanmar Language.</p>
      </div>

      <div class="academic-card" style="margin-bottom: 0; padding: 6px 9px;">
        <div class="academic-header">
          <div class="academic-title" style="font-size:8.2pt;">IBM SkillsBuild Credentials</div>
          <div class="academic-meta">Certified</div>
        </div>
        <div style="font-size: 7.4pt; font-weight: 700; color: #2563eb;">Web Dev &amp; UX Design Fundamentals</div>
        <p style="font-size: 6.9pt; color: #64748b;">Standardized certifications in web development principles and user experience design.</p>
      </div>
    </div>

    <div class="section-title" style="margin-top: 6px;">
      <span>Why Hire Wai Yan Hpone Lat (Teddy)</span>
    </div>

    <div class="why-hire-grid">
      <div class="why-hire-item">
        <strong>⚡ High Execution Velocity &amp; AI Literacy</strong>
        <p>Rapidly turns requirements into working software by leveraging modern AI agents, self-healing test loops, and automated build pipelines.</p>
      </div>
      <div class="why-hire-item">
        <strong>🔒 Security &amp; Concurrency by Design</strong>
        <p>Enforces server-authoritative pricing, row-level locks, webhook idempotency, and SSRF defenses from day one.</p>
      </div>
      <div class="why-hire-item">
        <strong>🧪 100+ Automated Regression Tests</strong>
        <p>Commitment to reliability. Every flagship repository maintains comprehensive integration test suites guaranteeing zero regressions.</p>
      </div>
      <div class="why-hire-item">
        <strong>📅 Full 44-Week Internship Availability</strong>
        <p>Committed for the complete 1-year cycle (29 March 2027 – 28 January 2028), ensuring sustained project ownership and engineering contribution.</p>
      </div>
    </div>

    <div class="cta-banner">
      <div>
        <div style="font-size: 8.8pt; font-weight: 800;">Review Live Deployments &amp; Verified Source Repositories:</div>
        <div style="font-size: 7.1pt; color: #94a3b8; margin-top: 1px;">
          Available for software engineering and full-stack technical interviews in Singapore.
        </div>
      </div>
      <div style="display: flex; gap: 6px;">
        <a href="https://teddy-qyuon-portfolio.vercel.app" style="background: #2563eb; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 7.2pt; font-weight: 700;">Live Portfolio</a>
        <a href="https://github.com/TeddyQyuon" style="background: #334155; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 7.2pt; font-weight: 700;">GitHub Profile</a>
        <a href="mailto:waiyanhponelat.eduvalor.2024g@gmail.com" style="background: #334155; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 7.2pt; font-weight: 700;">Email Candidate</a>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>Wai Yan Hpone Lat &bull; Nanyang Polytechnic (DAAA)</span>
    <span>Technical Project Portfolio &bull; Page 5 of 5</span>
    <span><a href="https://teddy-qyuon-portfolio.vercel.app">teddy-qyuon-portfolio.vercel.app</a></span>
  </div>
</div>

</body>
</html>
"""

with open(OUT_HTML, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Refined HTML Template written to {OUT_HTML}")

# Generate PDF via Chrome headless to clean path
chrome_cmd = [
    CHROME_PATH,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={OUT_PDF_CLEAN}",
    str(OUT_HTML)
]

print("Executing Chrome headless print-to-pdf...")
res = subprocess.run(chrome_cmd, capture_output=True, text=True)
print("Chrome return code:", res.returncode)

if os.path.exists(OUT_PDF_CLEAN):
    size_mb = os.path.getsize(OUT_PDF_CLEAN) / (1024 * 1024)
    print(f"SUCCESS: Generated PDF at {OUT_PDF_CLEAN} ({size_mb:.2f} MB)")
    
    # Check page count
    with open(OUT_PDF_CLEAN, "rb") as f:
        content = f.read()
    page_count = len(re.findall(rb'/Type\s*/Page\b', content))
    print(f"PDF Page Count: {page_count} pages")
    
    # Copy to workspace
    shutil.copyfile(OUT_PDF_CLEAN, OUT_PDF_WORKSPACE)
    print(f"Copied to workspace: {OUT_PDF_WORKSPACE}")
    
    portfolio_resume_dir = BASE_DIR / "public" / "resume"
    if portfolio_resume_dir.exists():
        shutil.copyfile(OUT_PDF_CLEAN, portfolio_resume_dir / "Wai_Yan_Hpone_Lat_Portfolio.pdf")
        print(f"Copied to portfolio public: {portfolio_resume_dir / 'Wai_Yan_Hpone_Lat_Portfolio.pdf'}")
        
    # Try updating the original file if unlocked
    try:
        shutil.copyfile(OUT_PDF_CLEAN, OUT_PDF_ORIG)
        print(f"Also updated: {OUT_PDF_ORIG}")
    except Exception as e:
        print(f"Note: {OUT_PDF_ORIG} is currently open by viewer (locked), {OUT_PDF_CLEAN} is ready to use!")
else:
    print("Error: PDF generation failed.")
