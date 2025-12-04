
import { BlogPost, Project } from './types';
import { SITE_CONFIG, GITHUB_CONFIG, MEDIA_CONFIG, PORTFOLIO_PROJECTS } from './config';

// --- Environment Variable Helper ---
// Safely retrieves env vars from process.env (Webpack/Node) or import.meta.env (Vite)
// Checks for VITE_ and REACT_APP_ prefixes automatically.
export const getEnv = (key: string): string => {
  const prefixes = ['', 'VITE_', 'REACT_APP_'];
  
  for (const prefix of prefixes) {
    const fullKey = prefix + key;
    
    // 1. Try Vite (import.meta.env)
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[fullKey]) {
        // @ts-ignore
        return import.meta.env[fullKey];
      }
    } catch (e) { /* ignore */ }

    // 2. Try Node/Webpack (process.env)
    try {
      if (typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env[fullKey]) {
        return process.env[fullKey];
      }
    } catch (e) { /* ignore */ }
  }
  
  return "";
};

// Re-export from config for backwards compatibility
export const APP_TITLE = SITE_CONFIG.title;
export const AUTHOR_NAME = SITE_CONFIG.authorName;

// GitHub Configuration
export const GITHUB_USERNAME = GITHUB_CONFIG.username; 
export const GITHUB_REPO = GITHUB_CONFIG.repo;
export const GITHUB_BLOG_PATH = GITHUB_CONFIG.blogPath;

// Assets
export const BG_MEDIA_URL = MEDIA_CONFIG.backgroundMedia; 
export const BGM_URL = MEDIA_CONFIG.music.folder + "/上田麗奈 - リテラチュア (文学) (Anime Size)_H.mp3"; 

// Re-export projects from config
export const PROJECTS = PORTFOLIO_PROJECTS;

// Fallback Mock Posts
export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'syntax-guide',
    title: '魔法书语法指南',
    date: '2025-01-01',
    category: '元数据',
    tags: ['Markdown', '文档', '魔法'],
    path: 'Meta/Grimoire Syntax Guide.md',
    excerpt: '这是一份关于本魔法书所支持的神奇符文（Markdown）的综合指南，包括数学公式、提示框和表格数据。',
    content: `
# 魔法书语法指南

欢迎，旅行者。本页面展示了这本魔法书的渲染能力。

## 1. 排版与强调
我们支持标准的 **粗体文本**、*斜体文本* 和 \`内联代码\`。

## 2. 数学咒语 (LaTeX)
使用 KaTeX 渲染复杂的数学咒语。

**行内公式：** 咒语的能量是 $E = mc^2$。

**块级公式：**
渲染方程：
$$ L_o(x, \\omega_o) = L_e(x, \\omega_o) + \\int_{\\Omega} f_r(x, \\omega_i, \\omega_o) L_i(x, \\omega_i) (\\omega_i \\cdot n) d\\omega_i $$

## 3. 提示框
用于突出显示信息的特殊区块。

> [!INFO] 魔法知识
> 这是一个信息提示框。适用于一般注释。

> [!WARNING] 危险咒语
> 小心！无限循环可能导致宇宙崩溃。

> [!TIP] 专家技巧
> 在计算点积之前，请始终对向量进行归一化。

> [!BUG] 矩阵中的故障
> 发现了一个野生的 bug！

> [!QUOTE] 伊蕾娜
> "我是灰烬魔女，伊蕾娜。"

## 4. 结构化数据（表格）

| 元素 | 魔力消耗 | 效果 |
|:--------|:----------|:-------|
| 火焰    | 15 MP     | 持续灼烧目标 |
| 冰霜     | 20 MP     | 降低移动速度 |
| 雷电 | 25 MP     | 眩晕敌人 |

## 5. 任务列表（任务日志）
- [x] 初始化渲染管线
- [x] 加载资源
- [ ] 实现全局光照
- [ ] 修复内存泄漏

## 6. 代码转换

\`\`\`csharp
// Unity C# 脚本
using UnityEngine;

public class Fireball : MonoBehaviour {
    void Update() {
        transform.Translate(Vector3.forward * Time.deltaTime * 10f);
    }
}
\`\`\`

## 7. 图片
标准 Markdown 图片和 Obsidian 嵌入在这里都可以使用。
![魔法火花](https://picsum.photos/id/1/600/300)
    `
  },
  {
    id: '1',
    title: '在 OpenGL 中实现阴影贴图',
    date: '2023-10-15',
    category: '计算机图形学',
    tags: ['C++', 'OpenGL', '渲染'],
    path: 'Computer Graphics/Shadow Mapping.md',
    excerpt: '深入探讨阴影贴图背后的数学原理以及 PCF 过滤的处理方法。',
    content: `
# 阴影贴图基础

阴影贴图是一种为 3D 计算机图形添加阴影的过程。

## 概念
1. 从光源的视角渲染场景。
2. 将深度信息存储在纹理（阴影贴图）中。
3. 从相机视角渲染场景，检查片段是否被遮挡。

## 数学示例

这是 GGX 分布函数：

$$D_{\\text{GGX}} = \\frac{\\alpha^2}{\\pi[(\\mathbf{n} \\cdot \\mathbf{h})^2(\\alpha^2 - 1) + 1]^2}$$

处理 **彼得潘宁** 伪影时，应用偏移是必不可少的。
    `
  },
  {
    id: '2',
    title: 'Unity DOTS：性能革命',
    date: '2023-11-20',
    category: 'Unity',
    tags: ['C#', 'DOTS', 'ECS'],
    path: 'Unity/DOTS/Performance Revolution.md',
    excerpt: '面向数据技术栈如何改变我们对游戏架构的思考方式。',
    content: `
# 转向 ECS

实体组件系统（ECS）是游戏开发中使用的一种模式，它更倾向于组合而非继承。

#### 表格示例：组件

| 组件 | 数据类型 | 用途 |
|-----------|-----------|-------|
| Translation | float3 | 世界空间位置 |
| Rotation | quaternion | 方向 |
| Velocity | float3 | 物理运动 |

> "默认性能。" - Unity Technologies
    `
  }
];
