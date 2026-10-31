/** Decorative panel motifs. Keys are product ids; values are static file stems. */
const PANEL_MOTIFS = {
  uniqueresearch: "uniqueresearch",
  uniquebase: "uniquebase",
  uniquebloom: "uniquebloom",
  "good-projects": "goodprojects",
}

/** @param {string} id */
export function panelMotif(id) {
  return PANEL_MOTIFS[id] || ""
}
