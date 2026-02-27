import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const WIDTH = 1290;
const HEIGHT = 2796;
const SCALE = 3;
const VP_WIDTH = WIDTH / SCALE;
const VP_HEIGHT = HEIGHT / SCALE;

const COLORS = {
  bg: '#0a0a0b',
  card: '#141416',
  cardAlt: '#1a1a1e',
  primary: '#c8ff00',
  text: '#ffffff',
  textMuted: '#888888',
  border: '#2a2a2e',
  success: '#10b981',
  error: '#ef4444',
};

const baseCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${VP_WIDTH}px;
    height: ${VP_HEIGHT}px;
    background: ${COLORS.bg};
    font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 28px 0;
    height: 54px;
    flex-shrink: 0;
  }
  .status-time { font-size: 16px; font-weight: 600; color: ${COLORS.text}; }
  .status-icons { display: flex; gap: 6px; align-items: center; }
  .status-icons svg { width: 18px; height: 18px; fill: ${COLORS.text}; }
  .notch {
    width: 126px;
    height: 34px;
    background: #000;
    border-radius: 0 0 20px 20px;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const statusBarHTML = `
  <div class="notch"></div>
  <div class="status-bar">
    <span class="status-time">9:41</span>
    <div class="status-icons">
      <svg viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
      <svg viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
    </div>
  </div>
`;

const screens = {
  '01-sign-in': `
    <style>
      ${baseCSS}
      .screen { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 28px; position: relative; }
      .logo { font-size: 86px; font-weight: 800; color: ${COLORS.primary}; margin-bottom: 8px; }
      .title { font-size: 30px; font-weight: 700; color: ${COLORS.text}; margin-bottom: 8px; }
      .subtitle { font-size: 16px; color: ${COLORS.textMuted}; margin-bottom: 36px; text-align: center; }
      .form { width: 100%; max-width: 320px; }
      .input {
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        color: ${COLORS.textMuted};
        font-size: 16px;
        width: 100%;
      }
      .btn-primary {
        background: ${COLORS.primary};
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        margin-bottom: 16px;
        width: 100%;
      }
      .btn-primary-text { color: ${COLORS.bg}; font-size: 16px; font-weight: 700; }
      .switch-text { color: ${COLORS.textMuted}; font-size: 14px; text-align: center; }
      .trial { position: absolute; bottom: 28px; color: ${COLORS.textMuted}; font-size: 14px; }
    </style>
    ${statusBarHTML}
    <div class="screen">
      <div class="logo">Q</div>
      <div class="title">Quizifications</div>
      <div class="subtitle">Learn smarter with AI-powered quizzes</div>
      <div class="form">
        <div class="input">Email</div>
        <div class="input">Password</div>
        <div class="btn-primary"><span class="btn-primary-text">Sign In</span></div>
        <div class="switch-text">Don't have an account? Sign Up</div>
      </div>
      <div class="trial">3-Day Free Trial, then $1.99/month</div>
    </div>
  `,

  '02-home-dashboard': `
    <style>
      ${baseCSS}
      .screen { flex: 1; padding: 20px; padding-top: 8px; }
      .greeting { font-size: 28px; font-weight: 700; color: ${COLORS.text}; margin-bottom: 24px; }
      .stats-row { display: flex; gap: 12px; margin-bottom: 12px; }
      .stat-card {
        flex: 1;
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 16px;
        padding: 20px;
        text-align: center;
      }
      .stat-value { font-size: 34px; font-weight: 700; color: ${COLORS.primary}; }
      .stat-label { font-size: 14px; color: ${COLORS.textMuted}; margin-top: 4px; }
      .btn-primary {
        background: ${COLORS.primary};
        border-radius: 16px;
        padding: 18px;
        text-align: center;
        margin-top: 24px;
      }
      .btn-primary-text { color: ${COLORS.bg}; font-size: 18px; font-weight: 700; }
      .btn-secondary {
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 16px;
        padding: 18px;
        text-align: center;
        margin-top: 12px;
      }
      .btn-secondary-text { color: ${COLORS.text}; font-size: 18px; font-weight: 600; }
    </style>
    ${statusBarHTML}
    <div class="screen">
      <div class="greeting">Hey, Matt!</div>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">7</div>
          <div class="stat-label">Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">85%</div>
          <div class="stat-label">Accuracy</div>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">12</div>
          <div class="stat-label">Notes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">42</div>
          <div class="stat-label">Answered</div>
        </div>
      </div>
      <div class="btn-primary"><span class="btn-primary-text">Start Quiz</span></div>
      <div class="btn-secondary"><span class="btn-secondary-text">+ Add Notes</span></div>
    </div>
  `,

  '03-add-notes': `
    <style>
      ${baseCSS}
      .screen { flex: 1; padding: 20px; padding-top: 8px; }
      .nav-title { font-size: 18px; font-weight: 600; color: ${COLORS.text}; text-align: center; margin-bottom: 20px; }
      .title-input {
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 12px;
        padding: 16px;
        color: ${COLORS.text};
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      .content-input {
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 12px;
        padding: 16px;
        color: ${COLORS.text};
        font-size: 15px;
        line-height: 1.5;
        min-height: 220px;
        margin-bottom: 16px;
      }
      .scan-buttons { display: flex; gap: 12px; margin-bottom: 16px; }
      .scan-btn {
        flex: 1;
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 12px;
        padding: 14px;
        text-align: center;
      }
      .scan-btn-text { color: ${COLORS.text}; font-size: 14px; font-weight: 600; }
      .save-btn {
        background: ${COLORS.primary};
        border-radius: 12px;
        padding: 18px;
        text-align: center;
        margin-top: 8px;
      }
      .save-btn-text { color: ${COLORS.bg}; font-size: 16px; font-weight: 700; }
    </style>
    ${statusBarHTML}
    <div class="screen">
      <div class="nav-title">Add Note</div>
      <div class="title-input">Biology Chapter 5</div>
      <div class="content-input">Photosynthesis is the process by which green plants convert light energy into chemical energy. It occurs in the chloroplasts, primarily in the leaves. The overall equation is: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.<br><br>The light-dependent reactions occur in the thylakoid membranes and produce ATP and NADPH. The Calvin cycle (light-independent reactions) occurs in the stroma and fixes carbon dioxide into glucose.</div>
      <div class="scan-buttons">
        <div class="scan-btn"><span class="scan-btn-text">📷 Scan with Camera</span></div>
        <div class="scan-btn"><span class="scan-btn-text">🖼 From Gallery</span></div>
      </div>
      <div class="save-btn"><span class="save-btn-text">Save & Generate Quiz</span></div>
    </div>
  `,

  '04-quiz-question': `
    <style>
      ${baseCSS}
      .screen { flex: 1; padding: 20px; padding-top: 8px; }
      .nav-title { font-size: 18px; font-weight: 600; color: ${COLORS.text}; text-align: center; margin-bottom: 24px; }
      .question { font-size: 22px; font-weight: 600; color: ${COLORS.text}; margin-bottom: 28px; line-height: 1.4; }
      .answers { display: flex; flex-direction: column; gap: 12px; }
      .answer-btn {
        display: flex;
        align-items: center;
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 12px;
        padding: 16px;
      }
      .answer-correct {
        border-color: ${COLORS.success};
        background: rgba(16, 185, 129, 0.1);
      }
      .answer-letter { font-size: 16px; font-weight: 700; color: ${COLORS.primary}; margin-right: 12px; width: 24px; }
      .answer-text { font-size: 16px; color: ${COLORS.text}; flex: 1; }
      .feedback { text-align: center; margin-top: 28px; }
      .feedback-text { font-size: 18px; font-weight: 700; color: ${COLORS.success}; margin-bottom: 16px; }
      .next-btn {
        background: ${COLORS.primary};
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        width: 100%;
      }
      .next-btn-text { color: ${COLORS.bg}; font-size: 16px; font-weight: 700; }
    </style>
    ${statusBarHTML}
    <div class="screen">
      <div class="nav-title">Quiz</div>
      <div class="question">What is the primary function of chloroplasts in plant cells?</div>
      <div class="answers">
        <div class="answer-btn answer-correct">
          <span class="answer-letter">A</span>
          <span class="answer-text">Converting light energy into chemical energy through photosynthesis</span>
        </div>
        <div class="answer-btn">
          <span class="answer-letter">B</span>
          <span class="answer-text">Breaking down glucose for cellular respiration</span>
        </div>
        <div class="answer-btn">
          <span class="answer-letter">C</span>
          <span class="answer-text">Storing genetic information in DNA</span>
        </div>
        <div class="answer-btn">
          <span class="answer-letter">D</span>
          <span class="answer-text">Transporting proteins throughout the cell</span>
        </div>
      </div>
      <div class="feedback">
        <div class="feedback-text">Correct!</div>
        <div class="next-btn"><span class="next-btn-text">Next Question</span></div>
      </div>
    </div>
  `,

  '05-settings': `
    <style>
      ${baseCSS}
      .screen { flex: 1; padding: 20px; padding-top: 8px; overflow-y: auto; }
      .nav-title { font-size: 18px; font-weight: 600; color: ${COLORS.text}; text-align: center; margin-bottom: 20px; }
      .section { margin-bottom: 24px; }
      .section-title { font-size: 14px; font-weight: 600; color: ${COLORS.textMuted}; margin-bottom: 8px; margin-left: 4px; }
      .card {
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 8px;
      }
      .card-row {
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .label { font-size: 12px; color: ${COLORS.textMuted}; margin-bottom: 4px; }
      .value { font-size: 16px; color: ${COLORS.text}; }
      .card-text { font-size: 16px; color: ${COLORS.text}; }
      .help-text { font-size: 12px; color: ${COLORS.textMuted}; margin-top: 4px; margin-left: 4px; }
      .toggle {
        width: 51px; height: 31px;
        background: ${COLORS.primary};
        border-radius: 16px;
        position: relative;
        flex-shrink: 0;
      }
      .toggle-knob {
        width: 27px; height: 27px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 2px; right: 2px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      .sign-out-btn {
        background: ${COLORS.card};
        border: 1px solid ${COLORS.border};
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        margin-bottom: 12px;
      }
      .sign-out-text { font-size: 16px; color: ${COLORS.text}; font-weight: 600; }
      .delete-btn {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid ${COLORS.error};
        border-radius: 12px;
        padding: 16px;
        text-align: center;
      }
      .delete-text { font-size: 16px; color: ${COLORS.error}; font-weight: 600; }
      .version { text-align: center; color: ${COLORS.textMuted}; font-size: 12px; margin-top: 24px; }
    </style>
    ${statusBarHTML}
    <div class="screen">
      <div class="nav-title">Settings</div>
      <div class="section">
        <div class="section-title">Account</div>
        <div class="card">
          <div class="label">Email</div>
          <div class="value">matt@email.com</div>
        </div>
        <div class="card">
          <div class="label">Name</div>
          <div class="value">Matt</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Notifications</div>
        <div class="card-row">
          <span class="card-text">Quiz Notifications</span>
          <div class="toggle"><div class="toggle-knob"></div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Subscription</div>
        <div class="card"><span class="card-text">Restore Purchases</span></div>
        <div class="help-text">To cancel: Settings → Your Name → Subscriptions</div>
      </div>
      <div class="section">
        <div class="section-title">Legal</div>
        <div class="card"><span class="card-text">Privacy Policy</span></div>
        <div class="card"><span class="card-text">Terms of Service</span></div>
      </div>
      <div class="section">
        <div class="section-title">Support</div>
        <div class="card"><span class="card-text">Contact Support</span></div>
      </div>
      <div class="sign-out-btn"><span class="sign-out-text">Sign Out</span></div>
      <div class="delete-btn"><span class="delete-text">Delete Account</span></div>
      <div class="version">Version 1.0.0</div>
    </div>
  `,
};

async function generateScreenshots() {
  const chromiumPath = '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium';
  
  const browser = await puppeteer.launch({
    executablePath: chromiumPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
  });

  const outputDir = 'app-store/screenshots/6.7-inch';
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [name, html] of Object.entries(screens)) {
    const page = await browser.newPage();
    await page.setViewport({ width: VP_WIDTH, height: VP_HEIGHT, deviceScaleFactor: SCALE });
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`, { waitUntil: 'load' });
    
    const outputPath = path.join(outputDir, `${name}.png`);
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`Generated: ${outputPath}`);
    await page.close();
  }

  await browser.close();
  console.log('All screenshots generated successfully!');
}

generateScreenshots().catch(console.error);
