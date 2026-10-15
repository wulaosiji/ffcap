export const SITE_LINKS = Object.freeze({
  report: "https://ffcap.cn/report.html",
  rankingApplication: "https://uniquecapital.feishu.cn/share/base/form/shrcn5cWrPZAThRZgxd5zBf9Cxg",
  uniqueClub: "https://uniqueclub.superun.yun/",
  uniqueBloom: "https://ffcap.cn/open.html",
  goodProjects: "https://ffcap.cn/bp.html",
  about: "/about",
});

export const HOME_NAV_ITEMS = Object.freeze([
  { label: "首页", href: "#top" },
  { label: "研究与榜单", href: "#research" },
  { label: "产品矩阵", href: "#products" },
  { label: "活动与生态", href: "#ecosystem" },
  { label: "关于我们", href: SITE_LINKS.about },
]);

export const PRODUCT_LINKS = Object.freeze([
  {
    code: "01 / FOUNDER",
    name: "UniqueClub",
    description: "面向 AI 创始人，完成 BP 解析、项目主页生成、编辑与分享。",
    action: "创建项目主页",
    href: SITE_LINKS.uniqueClub,
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
