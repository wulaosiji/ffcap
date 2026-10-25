export const SITE_LINKS = Object.freeze({
  report: "/research",
  rankingsHub: "/research/rankings",
  contact: "/contact",
  rankingApplication: "https://uniquecapital.feishu.cn/share/base/form/shrcn5cWrPZAThRZgxd5zBf9Cxg",
  uniqueBase: "https://uniquebase.cn/",
  uniqueBloom: "https://uniquebloom.cn/",
  goodProjects: "https://ffcap.cn/bp.html",
  about: "/about",
});

export const HOME_NAV_ITEMS = Object.freeze([
  { label: "首页", href: "#top" },
  { label: "研究与榜单", href: "#research" },
  { label: "产品矩阵", href: "#products" },
  { label: "关于我们", href: SITE_LINKS.about },
]);

export const PRODUCT_LINKS = Object.freeze([
  {
    code: "01 / COMPANY DATA",
    name: "UniqueBase",
    description: "可查询、可引用、可交给 AI 的全球 AI 公司与产品公开事实；每条记录带出处与稳定编码。",
    action: "进入 UniqueBase",
    href: SITE_LINKS.uniqueBase,
  },
  {
    code: "02 / EVENT",
    name: "UniqueBloom",
    description: "面向 AI 活动现场，连接嘉宾内容、现场互动与后续关系。",
    action: "进入 UniqueBloom",
    href: SITE_LINKS.uniqueBloom,
  },
  {
    code: "03 / INVESTOR",
    name: "有好项目",
    description: "面向认证投资人，浏览 AI 创业项目并进行 BP 对接。",
    action: "查看项目",
    href: SITE_LINKS.goodProjects,
  },
]);

export const FOCUSABLE_SELECTOR = "button:not([disabled]), a[href]";
