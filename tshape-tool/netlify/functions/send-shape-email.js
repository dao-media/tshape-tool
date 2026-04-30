const { Resvg } = require("@resvg/resvg-js");
const archiver = require("archiver");
const nodemailer = require("nodemailer");
const { PNG } = require("pngjs");
const jpeg = require("jpeg-js");
const { PassThrough } = require("stream");

const SHAPE_GUIDE = {
  I: {
    meaning:
      "An I-shaped designer goes very deep in one domain. This shape usually forms when someone has expert-level capability in one specialty and only light coverage in adjacent skills.",
    roles: [
      "Senior Specialist",
      "Lead Product Designer (domain-heavy)",
      "Motion Specialist",
      "Design Systems Specialist",
      "Accessibility Specialist",
      "Visual Design Specialist on larger teams",
    ],
    strengths: [
      "Highest depth and craft quality in one lane",
      "Faster complex execution in that lane",
      "Strong pattern recognition",
      "High credibility for specialist reviews",
    ],
    weaknesses: [
      "Can get bottlenecked outside core expertise",
      "Lower flexibility in smaller teams",
      "May need stronger collaboration rituals with cross-functional partners",
    ],
  },
  T: {
    meaning:
      "A T-shaped designer combines one strong depth area with broad working knowledge across neighboring disciplines. It is the most common high-performing shape in product teams.",
    roles: [
      "Product Designer",
      "UX Designer",
      "End-to-End Designer",
      "Design Lead in cross-functional squads",
      "Startup teams where one designer covers discovery through delivery",
    ],
    strengths: [
      "Strong balance of quality and adaptability",
      "Can translate across functions",
      "Makes better trade-offs",
      "Keeps delivery moving when context shifts",
    ],
    weaknesses: [
      "Depth can plateau if spread too thin",
      "Broad responsibilities can create overload",
      "Specialist-level craft may lag in highly technical edge cases",
    ],
  },
  Pi: {
    meaning:
      "A Pi-shaped designer has two deep strengths supported by broader capability. This shape is powerful when work requires fluency across two heavy domains.",
    roles: [
      "Staff Product Designer",
      "UX + Research Hybrid",
      "UI + Design Systems Lead",
      "Product + Brand Crossover",
      "Design Manager supporting multi-track execution",
    ],
    strengths: [
      "Can bridge disciplines with fewer handoffs",
      "High leverage across multiple problem types",
      "Strong systems thinking between strategy and execution",
    ],
    weaknesses: [
      "Prioritization can get difficult",
      "Context switching cost is higher",
      "Sustained growth needs intentional focus to avoid being spread across too many tracks",
    ],
  },
  M: {
    meaning:
      "An M-shaped designer develops three or more deep peaks with strong breadth. This shape often appears in experienced designers who have built multiple expert chapters.",
    roles: [
      "Principal Designer",
      "Design Director in hands-on environments",
      "Cross-Product Design Lead",
      "Innovation/Concept Lead",
      "Consultancy-style problem solver",
    ],
    strengths: [
      "Excellent for complex ambiguous programs",
      "Can mentor across disciplines",
      "Strong pattern transfer between domains",
      "Resilient during organizational change",
    ],
    weaknesses: [
      "Can be overutilized",
      "Hard to maintain depth in every peak simultaneously",
      "Role clarity may blur without clear ownership boundaries",
    ],
  },
  X: {
    meaning:
      "An X-shaped designer shows balanced high capability across many areas, often with leadership and integration ability across product, brand, and delivery.",
    roles: [
      "Design Lead",
      "Head of Design in lean orgs",
      "Product Design Manager",
      "Fractional Design Partner",
      "Strategic IC roles connecting business and user outcomes",
    ],
    strengths: [
      "Strong cross-functional leadership",
      "Broad decision quality",
      "High adaptability",
      "Reliable execution across the full product lifecycle",
    ],
    weaknesses: [
      "May lack signature specialist differentiation",
      "Broad accountability can create fatigue",
      "Impact depends on clear prioritization and delegation",
    ],
  },
};

function guideFieldPlain(field) {
  if (Array.isArray(field)) return field.join("; ");
  return String(field || "");
}

function isLikelyEmail(value) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseFirstName(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const first = trimmed.split(/\s+/)[0];
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function sanitizeBaseName(input, fallback) {
  const v = String(input || "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  const out = v.replace(/^-|-$/g, "");
  return out || fallback;
}

function buildJpegFromPngBuffer(pngBuffer, quality = 85) {
  const decoded = PNG.sync.read(pngBuffer);
  const rawImageData = {
    data: decoded.data,
    width: decoded.width,
    height: decoded.height,
  };
  const encoded = jpeg.encode(rawImageData, quality);
  return Buffer.from(encoded.data);
}

function zipBuffers(files) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const pass = new PassThrough();
    const chunks = [];
    pass.on("data", (chunk) => chunks.push(chunk));
    pass.on("end", () => resolve(Buffer.concat(chunks)));
    pass.on("error", reject);
    archive.on("error", reject);
    archive.pipe(pass);
    files.forEach((f) => archive.append(f.buffer, { name: f.name }));
    archive.finalize();
  });
}

function buildHtmlBody({ firstName, shapeKey, feedbackUrl, guide }) {
  const greeting = firstName ? `Hi ${firstName},` : "Hello,";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0f19;color:#e8ecff;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:24px;">
      <div style="background:#151b2a;border:1px solid #2a3552;border-radius:14px;padding:20px;">
        <p style="margin:0 0 12px;">${greeting}</p>
        <p style="margin:0 0 12px;">Thanks for testing T-Shaped, a tool I've recently begun building to give designers a high-level, big-picture view of their skills and competencies.</p>
        <p style="margin:0 0 12px;">Since you're a <strong>${shapeKey}-shaped designer</strong>, here's some info you may find interesting:</p>
        <div style="margin:16px 0;padding:14px;border-radius:12px;background:#0f1422;border:1px solid #26314d;">
          <p style="margin:0 0 8px;"><strong>What is this shape?</strong> ${guide.meaning}</p>
          <p style="margin:0 0 8px;"><strong>Where this shape thrives:</strong> ${guideFieldPlain(guide.roles)}</p>
          <p style="margin:0 0 8px;"><strong>Strengths:</strong> ${guideFieldPlain(guide.strengths)}</p>
          <p style="margin:0;"><strong>Blind spots:</strong> ${guideFieldPlain(guide.weaknesses)}</p>
        </div>
        <p style="margin:0 0 12px;">Again, thanks for using T-Shaped. Your files are attached to this email as a zip file.</p>
        <p style="margin:0 0 18px;">If you have any questions or issues, reach out to Dane at <a style="color:#cfe0ff;" href="mailto:hello@daneoleary.com">hello@daneoleary.com</a>. Want to provide feedback? <a style="color:#cfe0ff;" href="${feedbackUrl}" target="_blank" rel="noopener noreferrer">Click here</a>.</p>
      </div>
      <div style="margin-top:12px;padding:14px 16px;background:#101726;border:1px solid #26314d;border-radius:12px;color:#c8d5f7;">
        <div style="font-weight:600;margin-bottom:8px;">Warmly,<br/>Dane O'Leary</div>
        <div style="font-size:14px;line-height:1.6;">
          <a style="color:#dce6ff;text-decoration:none;border-bottom:1px solid rgba(220,230,255,.35);" href="https://linkedin.com/in/daneoleary" target="_blank" rel="noopener noreferrer">LinkedIn</a> ·
          <a style="color:#dce6ff;text-decoration:none;border-bottom:1px solid rgba(220,230,255,.35);" href="https://daneoleary.com" target="_blank" rel="noopener noreferrer">daneoleary.com</a> ·
          <a style="color:#dce6ff;text-decoration:none;border-bottom:1px solid rgba(220,230,255,.35);" href="mailto:hello@daneoleary.com">hello@daneoleary.com</a>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const toEmail = String(body.toEmail || "").trim();
    const userName = String(body.userName || "").trim();
    const shapeKey = String(body.shapeKey || "").trim() || "T";
    const svgString = String(body.svgString || "");
    const baseName = sanitizeBaseName(body.baseName, `t-shaped-${shapeKey.toLowerCase()}-designer`);
    if (!isLikelyEmail(toEmail)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid email address." }) };
    }
    if (!svgString || !svgString.includes("<svg")) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing export SVG payload." }) };
    }
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 1025);
    const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";
    const from = process.env.SMTP_FROM || "T-Shaped <noreply@t-shaped.local>";
    if (!host) {
      return { statusCode: 500, body: JSON.stringify({ error: "SMTP_HOST is not configured." }) };
    }
    const guide = SHAPE_GUIDE[shapeKey] || SHAPE_GUIDE.T;
    const resvg = new Resvg(svgString, { fitTo: { mode: "original" } });
    const pngBuffer = Buffer.from(resvg.render().asPng());
    const jpgBuffer = buildJpegFromPngBuffer(pngBuffer, 88);
    const svgBuffer = Buffer.from(svgString, "utf-8");
    const zipBuffer = await zipBuffers([
      { name: `${baseName}.png`, buffer: pngBuffer },
      { name: `${baseName}.jpg`, buffer: jpgBuffer },
      { name: `${baseName}.svg`, buffer: svgBuffer },
    ]);
    const firstName = parseFirstName(userName);
    const feedbackUrl =
      "https://docs.google.com/forms/d/e/1FAIpQLSeXdR-MvBi27FW1wgWyVv-dp7XgWqyS6I495NGsp_C4PuRoYA/viewform?usp=header";
    const subject = `Your ${shapeKey}-shaped skill map`;
    const textBody = [
      firstName ? `Hi ${firstName},` : "Hello,",
      "",
      "Thanks for testing T-Shaped, a tool I've recently begun building to give designers a high-level, big-picture view of their skills and competencies.",
      "",
      `Since you're a ${shapeKey}-shaped designer, here's some info you may find interesting:`,
      "",
      `What is this shape? ${guide.meaning}`,
      `Where this shape thrives: ${guideFieldPlain(guide.roles)}`,
      `Strengths: ${guideFieldPlain(guide.strengths)}`,
      `Blind spots: ${guideFieldPlain(guide.weaknesses)}`,
      "",
      "Again, thanks for using T-Shaped. Your files are attached to this email as a zip file.",
      "",
      `If you have any questions or issues, reach out to Dane at hello@daneoleary.com. Want to provide feedback? Click here: ${feedbackUrl}`,
      "",
      "Warmly,",
      "Dane O'Leary",
      "https://linkedin.com/in/daneoleary",
      "https://daneoleary.com",
      "hello@daneoleary.com",
    ].join("\n");

    const transportOpts = {
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    };
    const transporter = nodemailer.createTransport(transportOpts);
    await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      text: textBody,
      html: buildHtmlBody({ firstName, shapeKey, feedbackUrl, guide }),
      attachments: [
        {
          filename: `${baseName}-files.zip`,
          content: zipBuffer,
          contentType: "application/zip",
        },
      ],
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
};
