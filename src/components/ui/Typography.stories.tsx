import React from 'react';
import { Typography } from './Typography';

export default {
  title: 'UI/Typography',
  component: Typography,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {
        type: 'select',
        options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em', 'code', 'pre', 'blockquote'],
      },
    },
    className: {
      control: 'text',
    },
  },
};

export const Headings = {
  render: () => (
    <div className="space-y-6">
      <Typography variant="h1">H1 标题</Typography>
      <Typography variant="h2">H2 标题</Typography>
      <Typography variant="h3">H3 标题</Typography>
      <Typography variant="h4">H4 标题</Typography>
      <Typography variant="h5">H5 标题</Typography>
      <Typography variant="h6">H6 标题</Typography>
    </div>
  ),
};

export const Paragraphs = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="p">
        这是一个普通的段落文本。用于正文内容展示，字体大小适中，行高舒适，适合长时间阅读。
      </Typography>
      <Typography variant="p" className="text-lg">
        这是一个大号段落文本，适合需要强调的正文内容。
      </Typography>
      <Typography variant="p" className="text-sm text-muted-foreground">
        这是一个小号的辅助文本，通常用于说明或提示信息。
      </Typography>
    </div>
  ),
};

export const InlineElements = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="p">
        段落中的 <Typography variant="strong" className="inline">强调文本</Typography>，使用 strong 标签。
      </Typography>
      <Typography variant="p">
        段落中的 <Typography variant="em" className="inline">斜体文本</Typography>，使用 em 标签。
      </Typography>
      <Typography variant="p">
        代码示例： <Typography variant="code" className="inline">const example = 'Hello World';</Typography>
      </Typography>
    </div>
  ),
};

export const Blockquote = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="blockquote">
        这是一个引用块，用于引用他人的话语或重要的信息。
        引用块通常会有特殊的样式，如左侧边框或缩进。
      </Typography>
      <Typography variant="blockquote" className="italic">
        这是一个斜体引用，展示了不同样式的引用效果。
      </Typography>
    </div>
  ),
};

export const CodeBlock = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="pre">
        {`// 这是一个代码块示例
function helloWorld() {
  console.log('Hello, World!');
}

helloWorld();`}
      </Typography>
      <Typography variant="pre" className="bg-muted p-4 rounded-lg overflow-x-auto">
        {`// 带有背景色的代码块
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]`}
      </Typography>
    </div>
  ),
};

export const TextColors = {
  render: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Typography variant="p" className="text-primary theme-text-primary">
          主色调文本
        </Typography>
        <Typography variant="p" className="text-secondary theme-text-secondary">
          次级文本
        </Typography>
        <Typography variant="p" className="text-accent1 theme-text-accent1">
          强调色1文本
        </Typography>
        <Typography variant="p" className="text-accent2 theme-text-accent2">
          强调色2文本
        </Typography>
        <Typography variant="p" className="text-accent3 theme-text-accent3">
          强调色3文本
        </Typography>
        <Typography variant="p" className="text-destructive theme-text-destructive">
          错误文本
        </Typography>
        <Typography variant="p" className="text-success theme-text-success">
          成功文本
        </Typography>
        <Typography variant="p" className="text-warning theme-text-warning">
          警告文本
        </Typography>
      </div>
    </div>
  ),
};
