# Simple PDF Editor

纯浏览器端 PDF 页面编辑器 — 支持拆分、合并、排序、旋转、镜像，所有处理均在本地完成，数据不会上传。

> A lightweight, browser-based PDF page editor. Split, merge, reorder, rotate, and mirror pages — all processing happens locally, no data is uploaded.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 功能一览

| 功能 | 操作方式 | 快捷键 |
|------|----------|--------|
| 加载 PDF | 工具栏「打开 PDF」按钮 / 直接拖拽文件到窗口 | — |
| 追加合并 | 工具栏「追加 PDF」按钮 / 已加载页面后拖拽文件 | — |
| 拖拽排序 | 拖拽缩略图顶部的拖拽手柄 | — |
| 页面选中 | 点击 = 单选；Ctrl+点击 = 多选；Shift+点击 = 范围选 | — |
| 顺时针旋转 90° | 工具栏 / 右侧面板 | `R` |
| 逆时针旋转 90° | 工具栏 / 右侧面板 | — |
| 旋转 180° | 工具栏 | — |
| 水平镜像 | 工具栏 / 右侧面板 | `H` |
| 垂直镜像 | 工具栏 / 右侧面板 | `V` |
| 导出全部页面 | 工具栏「导出 PDF」按钮 | — |
| 导出选中页面 | 工具栏「导出选中」按钮 | — |
| 删除选中 | 工具栏「删除」按钮 | `Delete` / `Backspace` |
| 重置变换 | 工具栏「重置」/ 右侧面板「重置变换」 | — |
| 取消选中 | — | `Escape` |

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | React + TypeScript | 19 / 6.0 |
| 构建 | Vite | 8 |
| 样式 | Tailwind CSS | 4 |
| PDF 渲染 | pdfjs-dist (PDF.js) | 5.x |
| PDF 操作 | pdf-lib | 1.x |
| 拖拽排序 | @dnd-kit | 6 / 10 |
| 测试 | Vitest + Testing Library | 4 / 16 |

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:5173)
npm run dev

# 运行测试
npm test

# 运行测试（含覆盖率报告）
npm run test:coverage

# 生产构建
npm run build
```

---

## 项目结构

```
src/
├── components/
│   ├── HelpModal.tsx          # 使用说明弹窗
│   ├── Layout/
│   │   ├── GlobalNav.tsx      # 顶部导航栏（页数/选中计数）
│   │   ├── Toolbar.tsx        # 操作工具栏
│   │   ├── Panel.tsx          # 右侧属性面板
│   │   └── Footer.tsx         # 页脚
│   ├── EmptyState.tsx         # 空状态引导页
│   └── ThumbnailGrid.tsx      # 缩略图网格（含拖拽排序）
├── hooks/
│   └── usePdfStore.ts         # 核心状态管理 Hook
├── utils/
│   ├── pdfRenderer.ts         # PDF.js 渲染引擎
│   └── pdfExporter.ts         # pdf-lib 导出引擎
├── types.ts                   # 类型定义
├── App.tsx                    # 应用主壳 & 事件协调
├── index.css                  # Tailwind + Apple 设计 Token
└── main.tsx                   # 入口
```

---

## 架构设计

```
┌──────────────────────────────────────────────────────┐
│                     App.tsx                           │
│  (状态编排: 事件 → Hook → 渲染，键盘快捷键)           │
├──────────────────────────────────────────────────────┤
│  usePdfStore              pdfRenderer    pdfExporter │
│  (页面列表/选中/           (PDF.js       (pdf-lib     │
│   缩略图/旋转/镜像)         渲染缩略图)    导出 PDF)   │
├──────────────────────────────────────────────────────┤
│  GlobalNav │ Toolbar │ ThumbnailGrid │ Panel │ Footer│
└──────────────────────────────────────────────────────┘
```

### 数据流

```
用户上传 PDF（打开文件或拖拽）
  → file.arrayBuffer()
  → pdfRenderer.renderAllThumbnails(bytes.slice(0))   // 渲染缩略图
  → usePdfStore.addSource(source, pageIds)            // 存储原始数据
  → usePdfStore.setThumbnails(entries)                // 缓存缩略图
  → ThumbnailGrid 展示

用户操作（旋转/镜像/排序/查看使用说明）
  → usePdfStore 更新 PageInfo → CSS transform 实时预览
  → HelpModal 展示功能说明

用户导出
  → App.tsx 收集 pages[] + sources[]
  → pdfExporter.exportPdf()
    → 非镜像页: copyPages + setRotation
    → 镜像页:   copyPages + 内容流前置 cm 变换矩阵
  → 触发浏览器下载
```

### 核心数据模型

```typescript
interface PageInfo {
  id: string;              // 唯一标识（拖拽排序用）
  sourcePdfIndex: number;  // 来源 PDF 索引（合并场景）
  sourcePageIndex: number; // 在原 PDF 中的页码（0-based）
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;          // 水平镜像
  flipV: boolean;          // 垂直镜像
}

interface PdfSource {
  name: string;            // 文件名
  bytes: ArrayBuffer;      // 原始 PDF 字节（供导出使用）
  pageCount: number;
}
```

---

## 关键实现细节

### ArrayBuffer 分离问题

pdfjs-dist 在 `getDocument({ data: bytes })` 内部会 **transfer** ArrayBuffer，导致后续再用同一 `bytes` 时报错 `detached ArrayBuffer`。

**解决方案：** `renderAllThumbnails` 使用 `bytes.slice(0)` 创建副本传递给 pdfjs-dist，原始 `bytes` 保留给 pdf-lib 导出使用。解析和渲染合并为一次 `getDocument` 调用，避免两次解析。

### 镜像导出裁剪问题

早期方案使用 `embedPage` + `drawPage` 负宽高实现镜像，但 Form XObject 的 BBox 裁剪导致镜像内容下半部分不可见（文本可选中但视觉上被裁剪）。

**最终方案：** 使用 `copyPages` 复制页面后，直接向内容流**前置插入 `cm` 变换矩阵**：

| 镜像类型 | cm 矩阵 |
|----------|---------|
| 水平镜像 | `-1 0 0 1 width 0 cm` |
| 垂直镜像 | `1 0 0 -1 0 height cm` |
| 双向镜像 | `-1 0 0 -1 width height cm` |

### React 19 Strict Mode 与重复页面

`usePdfStore.addSource` 原先在 `setSources` 的 updater 回调内嵌套调用 `setPages`。Strict Mode double-invoke updater 导致 `setPages` 执行两次，页面被重复添加。

**解决方案：** 改用 `useRef` 追踪 sourceIndex，将 `setPages` 和 `setSources` 平级调用，不再嵌套。

---

## 设计系统

参照 Apple 设计语言（详见 `DESIGN.md`）：

- **唯一强调色** `#0066cc` — 所有交互元素共用
- **仅一个阴影** `rgba(0,0,0,0.22) 3px 5px 30px` — 仅用于缩略图卡片
- **无渐变**
- **按钮语法** — 主操作 pill 胶囊，次操作 pearl-capsule

---

## 测试

```bash
npm test              # 170 个测试用例
npm run test:coverage # 含覆盖率报告
```

| 指标 | 数值 |
|------|------|
| Statements | ~70% |
| Branches | ~73% |
| Lines | ~74% |
| 测试文件 | 10 |
| 测试用例 | 170 |

测试覆盖所有核心模块：状态管理 Hook、PDF 渲染/导出工具、UI 组件、集成测试。

---

## 已知限制 & 未来方向

### 当前限制

- 不支持加密 PDF
- 不支持 PDF 内容编辑（文字/图片修改）
- 镜像导出依赖 `pdf-lib` 内部 API（`newPage.node.get`），可能受 pdf-lib 版本升级影响
- 大 PDF（100+ 页）缩略图渲染需较长时间

### 可扩展方向

- 页面裁切（Crop）
- 页码水印叠加
- 批量导入导出
- 撤销/重做（Undo/Redo）
- 暗色模式
- i18n 国际化

---

## 许可证

[MIT](LICENSE)
