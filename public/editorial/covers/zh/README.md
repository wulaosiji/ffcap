# 中文文章封面

列表、详情和 OG 读取这个目录，不要求文章已经写进 `ENGLISH_RELATED`。

- 主文件：`<中文 slug>.webp`，页面地址 `/editorial/covers/zh/<中文 slug>.webp`
- 没有 webp 时才用同名 `.jpg`，再没有才用 `.png`。不要用 `.jpeg`，扩展名保持小写。
- slug 与中文文章库一致，只含小写字母和数字，例如 `20261014a0cmpf00.webp`。
- 画面保持社媒暖色编辑插画（amber / terracotta / sage），不要画成站点林绿 chrome。建议 16:9。
- 目录可以是空的。没有文件时，已核实的英文对照仍用 Substack 首图，其余中文文章没有封面。
- `zhcoverlocalfixture.webp` 是 `tests/cover-image.test.mjs` 的 1×1 测试夹具，不是文章封面。批量出图不要删它，也不要把它当成某篇文章。

这次只固定路径，不在这里提交成批图片。研究列表、文章详情和对应 OG 每次请求按磁盘判断文件在不在。首页、数据与榜单、活动与奖项在构建时定封面，只丢文件、不重新构建时这三处不会换图。
