/** Public company contact card (P0). Office street lines can be appended to OFFICE_CITIES later. */
export const CONTACT = Object.freeze({
  name: { zh: '吴畏Delta', en: 'Delta Wu (吴畏Delta)' },
  email: 'delta.wu@ffcap.cn',
  /** City-level presence only until verified street addresses ship. */
  officeCities: { zh: '上海 · 北京 · 杭州 · 广州', en: 'Shanghai · Beijing · Hangzhou · Guangzhou' },
  officeDetailPlaceholder: {
    zh: '各办公室详细地址将在此补充。',
    en: 'Verified office addresses will be listed here when available.',
  },
})
