/**
 * Tool lists mapped to selectable categories/specialties (sources: Tools To Know + New _ Up-and-Coming).
 * Keys must match `DATA.categories` / `DATA.specializations` strings in appRuntime.js.
 */
export const TOOLS_TO_KNOW_BY_SKILL = {
  "Web Design": ["Figma", "Webflow", "Framer"],
  "Mobile App Design": ["Figma", "Sketch", "ProtoPie", "UXPin"],
  "UX/Product Design (UXD)": ["Figma", "FigJam", "Miro", "Axure RP", "Balsamiq"],
  "Interaction Design (IxD)": ["ProtoPie", "Principle", "Framer", "Spline"],
  Branding: ["Adobe Illustrator", "Adobe InDesign", "Figma", "Canva"],
  "Print Design": ["Adobe InDesign", "Adobe Illustrator", "Affinity Publisher"],
  "Editorial Design": ["Adobe InDesign", "Affinity Publisher", "QuarkXPress", "Maglr"],
  "Packaging Design": ["Adobe Illustrator", "Esko Studio", "Adobe Dimension", "Adobe Substance 3D", "ArtiosCAD"],
  "Signage Design": ["Adobe Illustrator", "CorelDRAW", "FlexiSign", "SketchUp"],
  "Exhibition & Trade Show Design": ["SketchUp", "Vectorworks", "3ds Max", "AutoCAD"],
  Animation: ["Adobe After Effects", "Toon Boom Harmony", "Blender", "Moho (Anime Studio)"],
  "3D Design & Modeling": ["Blender", "Autodesk Maya", "Cinema 4D", "ZBrush"],
  "Video Post-Production": ["Adobe Premiere Pro", "DaVinci Resolve", "Final Cut Pro", "Adobe After Effects"],
  "Graphic Design": ["Adobe Photoshop", "Adobe Illustrator", "Affinity Designer", "Canva"],
  Illustration: ["Procreate", "Adobe Photoshop", "Adobe Illustrator", "Clip Studio Paint"],
  "Character Design": ["ZBrush", "Procreate", "Adobe Photoshop", "Adobe Illustrator", "Blender"],
  "Social Media Design": ["Canva", "Figma", "Adobe Express", "CapCut"],
  "Email Design": ["Figma", "Mailchimp", "Stripo", "Litmus"],
  "Presentation Design": ["Pitch", "Apple Keynote", "Google Slides", "Microsoft PowerPoint"],
  "Game Design": ["Unity", "Unreal Engine", "Godot", "Miro", "Twine"],
  "AR/VR/XR Design": ["Unity", "Unreal Engine", "Spline", "Spark AR", "Lens Studio"],
  "UI & Dashboard Design (UID)": ["Figma", "Penpot", "Sketch", "Highcharts", "D3.js"],
  "Brand Identity": ["Adobe Illustrator", "Affinity Designer", "Figma", "Adobe InDesign", "Milanote"],
  "Motion Graphics": ["Adobe After Effects", "Cavalry", "Cinema 4D", "Rive", "LottieFiles"],
  "Photo Editing & Retouching": ["Adobe Photoshop", "Adobe Lightroom", "Capture One", "Affinity Photo"],
  "Concept Art": ["Adobe Photoshop", "Procreate", "Blender", "Corel Painter"],
  "Icon Design": ["Adobe Illustrator", "Figma", "Affinity Designer", "IconJar"],
  Typography: ["Glyphs", "RoboFont", "FontLab", "Adobe Illustrator"],
  Infographics: ["Adobe Illustrator", "Piktochart", "RawGraphs", "Canva"],
  "Data Visualization": ["Tableau", "Power BI", "D3.js", "Figma"],
  "Accessibility & Ethical Design": ["Stark", "WAVE", "Axe DevTools", "Color Oracle"],
  "Design Systems & Governance": ["Figma", "Zeroheight", "Storybook", "Tokens Studio"],
  "Information Architecture (IA)": ["Miro", "FigJam", "Optimal Workshop", "Mural", "FlowMapp", "Lucidchart"],
  "User Research & Testing": ["UserTesting", "Hotjar", "CrazyEgg", "Maze", "Dovetail", "Lookback"],
  "Prototyping & Wireframing": ["Figma", "Axure RP", "Balsamiq", "ProtoPie"],
  "Micro-Interactions & UI Animation": ["LottieFiles", "Jitter", "Rive", "ProtoPie"],
  "Component Architecture": ["Figma", "Storybook", "Zeplin", "React / Vue (Frameworks)"],
  DesignOps: ["Notion", "Jira", "Asana", "Airtable", "Figma"],
  "Conversion Rate Optimization (CRO)": [
    "Hotjar",
    "Clarity",
    "VWO",
    "Optimizely",
    "Google Analytics (GA4)",
    "Google Tag Manager (GTM)",
    "Google Search Console (GSC)",
  ],
  "Brand Strategy": ["Miro", "FigJam", "Notion", "Keynote", "Typeform"],
  "Color Theory & Systems": ["Figma", "Coolors", "Adobe Color", "ColorBox"],
  "Visual Hierarchy & Design": ["Figma", "Adobe Illustrator", "Stark", "Crazy Egg", "Hotjar"],
  "AI-Augmented Design Workflows": ["Midjourney", "Adobe Firefly", "Relume", "Claude", "Cursor", "Linear"],
};

export const NEW_PROMISING_BY_SKILL = {
  "Web Design": ["Dora", "v0", "Relume"],
  "Mobile App Design": ["Play", "Judo", "Bravo Studio"],
  "UX/Product Design (UXD)": ["Creatie", "Uizard", "Visily"],
  "Interaction Design (IxD)": ["Bezi (ShapesXR)", "Jitter", "Linearity Move"],
  Branding: ["Kittl", "ZeBrand", "Brandmark"],
  "Print Design": ["Linearity Curve (Vectornator)", "Studio.design"],
  "Editorial Design": ["Vev", "Readymag", "Foleon"],
  "Packaging Design": ["Pacdora", "Boxshot", "Creative Edge iC3D"],
  "Signage Design": ["VectorStyler", "Magnific AI"],
  "Exhibition & Trade Show Design": ["Polycam", "Spline"],
  Animation: ["Fable", "Cascadeur", "LottieLab"],
  "3D Design & Modeling": ["Plasticity", "Womp", "Spline"],
  "Video Post-Production": ["RunwayAI", "Descript", "Opus Clip"],
  "Graphic Design": ["Recraft", "Kittl", "Microsoft Designer"],
  Illustration: ["Magma", "Krita", "Vizcom"],
  "Character Design": ["Hero Forge", "VRoid Studio"],
  "Social Media Design": ["VistaCreate", "Glorify"],
  "Email Design": ["Dyspatch", "Chamaileon"],
  "Presentation Design": ["Gamma", "Tome", "iA Presenter"],
  "Game Design": ["Bevy", "PlayCanvas", "Defold"],
  "AR/VR/XR Design": ["ShapesXR", "Campfire", "Bezi"],
  "UI & Dashboard Design (UID)": ["Tremor", "Creatie"],
  "Brand Identity": ["Frontify", "Baseline"],
  "Motion Graphics": ["Cavalry"],
  "Photo Editing & Retouching": ["Evoto", "Photoroom", "Radiant Photo"],
  "Concept Art": ["Krea AI", "Leonardo AI"],
  "Icon Design": ["Magician", "Nucleo"],
  Typography: ["Fontra", "Birdfont"],
  Infographics: ["Flourish", "Mind the Graph"],
  "Data Visualization": ["Observable", "Chart.js", "Recharts"],
  "Accessibility & Ethical Design": ["Evinced", "Useberry"],
  "Design Systems & Governance": ["Supernova", "Specify", "Backlight"],
  "Information Architecture (IA)": ["Octopus.do"],
  "User Research & Testing": ["Sprig", "Condens", "Lyssna"],
  "Prototyping & Wireframing": ["Play", "Visily"],
  "Micro-Interactions & UI Animation": ["Rive", "LottieLab"],
  "Component Architecture": ["Mitosis", "UXPin Merge"],
  DesignOps: ["Lingo", "Supernova"],
  "Conversion Rate Optimization (CRO)": ["PostHog", "Microsoft Clarity"],
  "Brand Strategy": ["Stratpad", "ZeBrand"],
  "Color Theory & Systems": ["Huemint", "Leonardo"],
  "Visual Hierarchy & Design": ["VisualEyes", "Attention Insight"],
  "AI-Augmented Design Workflows": ["Magnific AI", "Galileo AI", "Krea AI"],
};

/**
 * Deduped union in selection order.
 * @param {readonly string[]} selectedSkills categories/specialties in user order
 * @param {Record<string, readonly string[]>} bySkillTable
 */
export function aggregateToolsFromSelections(selectedSkills, bySkillTable) {
  const seen = new Set();
  const out = [];
  for (const s of selectedSkills) {
    const list = bySkillTable[s];
    if (!Array.isArray(list)) continue;
    for (const t of list) {
      const tt = typeof t === "string" ? t.trim() : "";
      if (!tt || seen.has(tt)) continue;
      seen.add(tt);
      out.push(tt);
    }
  }
  return out;
}

/**
 * One row per tool: rendered under the first skill in `selectedSkills` whose list contains it.
 * Shape insights pass skills sorted by rating (highest first); `sources` lists all contributing skills for tooltips.
 * @returns {{ skill: string, tools: { label: string, sources: string[] }[]}[]}
 */
export function buildToolSectionsByFirstSkill(selectedSkills, bySkillTable) {
  /** @type {Map<string, string[]>} */
  const sourcesByTool = new Map();

  for (const skill of selectedSkills) {
    const list = bySkillTable[skill];
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      const label = typeof raw === "string" ? raw.trim() : "";
      if (!label) continue;
      let src = sourcesByTool.get(label);
      if (!src) {
        src = [];
        sourcesByTool.set(label, src);
      }
      if (!src.includes(skill)) src.push(skill);
    }
  }

  /** @type {{ skill: string, tools: { label: string, sources: string[] }[]}[]} */
  const sections = [];

  for (const skill of selectedSkills) {
    const list = bySkillTable[skill];
    if (!Array.isArray(list)) continue;
    const tools = [];
    const seenInSkill = new Set();

    for (const raw of list) {
      const label = typeof raw === "string" ? raw.trim() : "";
      if (!label || seenInSkill.has(label)) continue;
      seenInSkill.add(label);
      const contrib = sourcesByTool.get(label);
      if (!contrib?.length || contrib[0] !== skill) continue;
      tools.push({ label, sources: contrib.slice() });
    }
    if (tools.length) sections.push({ skill, tools });
  }
  return sections;
}
