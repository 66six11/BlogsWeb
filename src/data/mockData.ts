import { BlogPost } from '../types';

// Mock data for Vercel preview mode
export const mockBlogPosts: BlogPost[] = [
  {
    id: 'preview-1',
    title: '立体角',
    date: '2024-12-08',
    category: '数学',
    tags: ['几何', '立体几何', '数学'],
    excerpt: '立体角的定义和应用...',
    content: `# 立体角

立体角是三维空间中的角度概念，类似于平面角在二维空间中的定义。

## 定义

立体角 $\\Omega$ 定义为：

$$
\\Omega = \\frac{A}{r^2}
$$

其中：
- $A$ 是球面上的面积
- $r$ 是球的半径

## 单位

立体角的单位是**球面度（steradian, sr）**。

完整球面的立体角为：

$$
\\Omega_{\\text{sphere}} = 4\\pi \\text{ sr}
$$

## 应用

立体角在以下领域有重要应用：

1. **物理学**
   - 辐射强度计算
   - 光学系统设计
   - [[辐射强度]]的定义

2. **天文学**
   - 天体观测
   - 星等计算

3. **计算机图形学**
   - 光照计算
   - 渲染算法

## 相关链接

- [辐射强度](https://zhida.zhihu.com/search?q=辐射强度)
- [[辐射强度]]

> [!note] 提示
> 立体角是理解三维空间中角度关系的重要概念。
`,
    path: 'math/立体角.md',
    slug: 'solid-angle',
  },
  {
    id: 'preview-2',
    title: '辐射强度',
    date: '2024-12-07',
    category: '物理',
    tags: ['光学', '辐射', '物理'],
    excerpt: '辐射强度的定义和测量方法...',
    content: `# 辐射强度

辐射强度描述了光源在特定方向上的辐射功率。

## 定义

辐射强度 $I$ 定义为单位[[立体角]]内的辐射通量：

$$
I = \\frac{d\\Phi}{d\\Omega}
$$

其中：
- $\\Phi$ 是辐射通量
- $\\Omega$ 是立体角

## 单位

辐射强度的单位是 **瓦特每球面度（W/sr）**。

## 测量方法

1. **直接测量法**
   - 使用光度计
   - 测量特定方向的光通量

2. **间接测量法**
   - 通过照度计算
   - 利用距离平方反比定律

## 相关概念

立体角的详细说明请参考 [[立体角]] 文章。

> [!tip] 重要
> 辐射强度与距离无关，是光源的固有属性。

### 示例代码

\`\`\`python
def calculate_intensity(flux, solid_angle):
    """计算辐射强度"""
    return flux / solid_angle

# 示例
flux = 100  # W
solid_angle = 0.1  # sr
intensity = calculate_intensity(flux, solid_angle)
print(f"辐射强度: {intensity} W/sr")
\`\`\`
`,
    path: 'physics/辐射强度.md',
    slug: 'radiant-intensity',
  },
  {
    id: 'preview-3',
    title: 'Markdown 语法示例',
    date: '2024-12-06',
    category: '示例',
    tags: ['markdown', '文档', '示例'],
    excerpt: 'Markdown 渲染器的各种语法示例...',
    content: `# Markdown 语法示例

这是一个展示 Markdown 渲染器功能的示例文档。

## 基础格式

这是一个段落，包含 **粗体文本** 和 *斜体文本*。

## 列表示例

### 无序列表

- 第一项
- 第二项
  - 嵌套项 1
  - 嵌套项 2
- 第三项

### 有序列表

1. **步骤一：**
   - 首先做这个
   - 然后做那个
2. **步骤二：**
   - 继续操作
3. **推理过程：**
   - 查看目标空格所在的那一行（横行）。
   - 找出该行中已经填入的数字。
   - 排除这些数字后，剩下的候选数字就是可能的答案。

### 任务列表

- [x] 完成的任务
- [ ] 未完成的任务
- [x] 另一个完成的任务

## 链接

- 内部链接：[[立体角]]
- 外部链接：[GitHub](https://github.com)
- 知乎链接：[辐射强度](https://zhida.zhihu.com/search?q=辐射强度)

## 数学公式

### 行内公式

爱因斯坦质能方程：$E = mc^2$

### 块级公式

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## Callouts

> [!note] 笔记
> 这是一个笔记类型的 callout。

> [!tip] 提示
> 这是一个提示类型的 callout。

> [!warning] 警告
> 这是一个警告类型的 callout。

## 代码块

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

## 表格

| 语法 | 说明 | 示例 |
|------|------|------|
| **粗体** | 加粗文本 | \`**text**\` |
| *斜体* | 倾斜文本 | \`*text*\` |
| [[链接]] | Wiki 链接 | \`[[page]]\` |

## 引用

> 这是一个普通的引用块。
> 可以包含多行内容。

## 分隔线

---

## 文章嵌入

下面是嵌入的立体角文章内容：

![[立体角]]
`,
    path: 'examples/markdown-demo.md',
    slug: 'markdown-demo',
  },
];

// Check if we're in preview mode
export const isPreviewMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check VERCEL_ENV through import.meta.env
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV || import.meta.env.VERCEL_ENV;
  if (vercelEnv === 'preview') return true;
  
  // Check if URL contains vercel preview domain patterns
  const hostname = window.location.hostname;
  const isVercelPreview = hostname.includes('-git-') || 
                         hostname.includes('.vercel.app') && !hostname.includes('blogsweb.vercel.app');
  
  // Also allow ?preview=true query parameter for testing
  const urlParams = new URLSearchParams(window.location.search);
  const hasPreviewParam = urlParams.get('preview') === 'true';
  
  return isVercelPreview || hasPreviewParam;
};
