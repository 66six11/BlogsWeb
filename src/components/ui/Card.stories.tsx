import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

export default {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  subcomponents: {
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
  },
};

export const Basic = {
  render: (args) => (
    <Card {...args}>
      <CardContent>
        <p>这是一个基本的卡片组件</p>
      </CardContent>
    </Card>
  ),
};

export const WithHeader = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>卡片标题</CardTitle>
        <CardDescription>这是一个带有标题和描述的卡片</CardDescription>
      </CardHeader>
      <CardContent>
        <p>卡片内容区域，可以放置任何内容</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>卡片标题</CardTitle>
      </CardHeader>
      <CardContent>
        <p>卡片内容</p>
      </CardContent>
      <CardFooter>
        <p>卡片底部区域</p>
      </CardFooter>
    </Card>
  ),
};

export const Complete = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>完整卡片示例</CardTitle>
        <CardDescription>包含标题、描述、内容和底部的完整卡片</CardDescription>
      </CardHeader>
      <CardContent>
        <p>这是一个完整的卡片示例，展示了卡片组件的所有功能。</p>
        <p>你可以在卡片中放置任何React组件，包括文本、图片、按钮等。</p>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <span>底部左侧内容</span>
          <span>底部右侧内容</span>
        </div>
      </CardFooter>
    </Card>
  ),
};
