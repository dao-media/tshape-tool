const { Resvg } = require("@resvg/resvg-js");
const archiver = require("archiver");
const nodemailer = require("nodemailer");
const { PNG } = require("pngjs");
const jpeg = require("jpeg-js");
const { PassThrough } = require("stream");

const SHAPE_GUIDE = {
  I: {
    meaning:
      "The I-shape is the foundational archetype—a designer defined by exceptional depth in a single discipline, with limited breadth across adjacent fields. The vertical bar of the \"I\" represents mastery: years of focused investment in one craft, whether that's motion design, UX research, typography, front-end development, or illustration. Morten T. Hansen, co-author of Great by Choice, famously called this the \"lone star\" profile—someone who performs at the highest level within their lane, largely under their own power. The I-shaped designer is a true specialist, and in the right environment, that specialization is enormously valuable.",
    roles: [
      "Motion Designer",
      "Brand Identity Designer",
      "UX Researcher",
      "UI Designer",
      "Illustrator",
      "Front-End Developer",
    ],
    strengths: [
      "Elite craft: unmatched quality and credibility through deep specialization",
      "High efficiency: faster execution with fewer revisions and a higher ceiling for quality",
      "Competitive moat: depth as a strong differentiator in highly specialized fields",
      "Team reliability: the go-to expert when a specific domain must be executed flawlessly",
    ],
    weaknesses: [
      "Collaboration friction: often struggles in highly cross-functional environments",
      "Communication gaps: difficulty explaining the value of their work to non-specialists",
      "Narrow focus: may struggle with decisions that account for the broader product ecosystem",
      "Career vulnerability: exposed if their single domain is automated, deprioritized, or obsolete",
    ],
  },
  T: {
    meaning:
      "Popularized by IDEO CEO Tim Brown and traceable to McKinsey & Company's internal hiring frameworks in the 1980s, the T-shaped designer combines one deep area of expertise—the vertical stroke—with a broad working fluency across related disciplines—the horizontal bar. The T-shape is arguably the most widely recognized and discussed model in modern design practice. That horizontal bar isn't just about skills. Brown emphasized that it's fundamentally about empathy: the capacity to understand and genuinely engage with other people's disciplines, enough to collaborate productively across functions. A T-shaped designer doesn't need to be the best researcher, writer, or engineer in the room—but they need to understand what those people are doing well enough so they're better able to build with them.",
    roles: ["Senior UX Designer", "Product Designer", "Design Lead"],
    strengths: [
      "Collaborative range: speaks authoritatively on their discipline while engaging meaningfully with others",
      "Empathy-driven: effective partners and user advocates by stepping into other perspectives",
      "Cross-functional value: excels in integrated, stakeholder-heavy environments",
      "Growth potential: depth and breadth create a strong foundation for management or strategy roles",
    ],
    weaknesses: [
      "Expertise ceiling: rarely the absolute deepest expert in any single room",
      "Generalist drift: risk of losing respect if breadth grows at the expense of maintaining real craft",
      "Competitive disadvantage: may lose out to I-shaped specialists in highly targeted roles",
      "Lack of focus: can spread too thin—many conversations but owning too few outcomes",
    ],
  },
  Pi: {
    meaning:
      "The Pi-shape is an evolution of the T with a second vertical leg. Whereas a T-shaped designer has one area of deep expertise, a Pi-shaped designer has two. The term has been used in organizational theory to describe professionals with a broad mastery of general skills atop a few spikes of deep functional expertise, and in design it typically describes someone who has built genuine mastery in two complementary disciplines—say, UX research and interaction design, or visual design and front-end development, or brand strategy and content design. The two legs don't have to be in the same sub-field, but they do need to be real. Pi isn't a claim of superficial familiarity—it represents two distinct areas where the designer can produce at a high level.",
    roles: [
      "Senior Product Designer",
      "Brand Designer",
      "UX Designer",
      "Hybrid Roles (e.g., Design + Strategy, UX + Ops)",
    ],
    strengths: [
      "Seamless integration: less handoff friction and miscommunication between two domains",
      "High efficiency: end-to-end quality improves—valuable on lean or resource-constrained teams",
      "Dual credibility: can authoritatively hold both sides of complex, cross-disciplinary conversations",
      "Career resilience: a built-in hedge if one specialty loses market relevance",
    ],
    weaknesses: [
      "High maintenance: cognitively and professionally demanding to keep two deep skills current",
      "Atrophy risk: if one skill is neglected, the profile naturally collapses back into a T-shape",
      "Market confusion: harder to title, evaluate, or place in a job market built for single specialists",
      "Narrative complexity: more effort to explain professional value than a simple specialist",
    ],
  },
  M: {
    meaning:
      "The M-shape—sometimes called comb-shaped—describes a designer who has developed meaningful depth across three or more distinct disciplines, all sitting on a shared base of broad professional knowledge. Think of it as a Pi that has kept growing: each additional vertical represents another area where the designer has genuine expertise, not just passing familiarity. The metaphor of a comb is particularly apt with more than three legs—more teeth, each with real depth. Research from Cambridge's Design Society found that in practice, when studying real design engineers across career stages, the M or comb shape was more common than the traditional T—suggesting that experienced designers naturally accumulate multiple areas of depth over a career, even if they don't label it that way. The M-shaped designer is a high-adaptability profile, capable of filling gaps, straddling disciplines, and contributing meaningfully across a wide surface area.",
    roles: [
      "Senior Individual Contributor",
      "Staff-Level Designer",
      "Design Operations / Systems Role",
      "Creative Director",
      "Design Lead",
    ],
    strengths: [
      "Deep versatility: contributes at a high level across three or more areas without sacrificing quality",
      "Force multiplier: wears multiple hats, fills gaps, and adapts quickly to shifting team needs",
      "Cross-disciplinary leadership: manages complex projects with genuine, multi-domain credibility",
      "Maximum resilience: highly insulated when their identity isn't tied to a single skill",
    ],
    weaknesses: [
      "Skill dilution: harder to reach the absolute mastery ceiling of a dedicated I-shaped specialist in any one area",
      "Opportunity cost: time spent building a third or fourth skill prevents deepening the first or second",
      "Positioning challenges: may be undervalued as a generalist rather than a multi-specialist",
      "Lack of clarity: a broad array of strengths makes it difficult to establish a clear professional hierarchy",
    ],
  },
  X: {
    meaning:
      "The X-shape is the most distinctive—and most misunderstood—archetype in the framework. It doesn't represent the most skills, the most depth, or the broadest knowledge. It represents a different kind of value entirely: the ability to connect disciplines, lead people, and create conditions where others do their best work. The X-shape emerged as an evolution of the T in leadership contexts. Where a T-shaped designer contributes across disciplines, an X-shaped designer orchestrates across them—synthesizing insights, setting strategy, aligning teams, and driving toward shared goals. Heather McGowan, a future-of-work strategist, describes the X-shaped person as embodying interdisciplinarity with a participatory approach and a holistic focus on a common goal. Ed Catmull and John Lasseter of Pixar are frequently cited as archetypal examples: both started as deep technical practitioners and evolved into leaders whose primary value became building the conditions for creative excellence, rather than executing it themselves.",
    roles: [
      "Motion Designer",
      "Brand Identity Designer",
      "UX Researcher",
      "UI Designer",
      "Illustrator",
      "Front-End Developer",
    ],
    strengths: [
      "Master orchestrators: shift from individual contribution to aligning teams and strategies",
      "Holistic focus: synthesize insights across disciplines toward common organizational goals",
      "Ecosystem builders: create the conditions and environments for others to do their best work",
      "Scaled influence: impact at the organizational and executive level",
    ],
    weaknesses: [
      "Craft atrophy: hands-on skills naturally erode as focus shifts to strategy and people",
      "Loss of credibility: moving too far from the work can damage practitioner respect needed to lead",
      "The \"empty experience\" trap: risk of being overly facilitative without authoritative depth",
      "Leadership isolation: often understanding everything but fully belonging nowhere",
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
