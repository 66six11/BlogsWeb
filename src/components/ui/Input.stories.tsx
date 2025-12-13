import React from 'react';
import { Input } from './Input';

export default {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      },
    },
  },
};

export const Default = {
  args: {
    placeholder: '请输入内容',
  },
};

export const WithValue = {
  args: {
    defaultValue: '已有值的输入框',
    placeholder: '请输入内容',
  },
};

export const WithLabel = {
  render: (args) => (
    <div className="space-y-2">
      <label htmlFor="input-with-label" className="block text-sm font-medium">
        输入框标签
      </label>
      <Input id="input-with-label" {...args} placeholder="请输入内容" />
    </div>
  ),
};

export const Disabled = {
  args: {
    disabled: true,
    placeholder: '禁用的输入框',
  },
};

export const ReadOnly = {
  args: {
    readOnly: true,
    defaultValue: '只读的输入框',
  },
};

export const ErrorState = {
  render: (args) => (
    <div className="space-y-2">
      <Input 
        {...args} 
        placeholder="错误状态的输入框"
        className="border-destructive theme-border-destructive"
      />
      <p className="text-sm text-destructive theme-text-destructive">
        这是一个错误提示信息
      </p>
    </div>
  ),
};

export const DifferentTypes = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          邮箱
        </label>
        <Input id="email" type="email" placeholder="your@email.com" />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          密码
        </label>
        <Input id="password" type="password" placeholder="••••••••" />
      </div>
      <div className="space-y-2">
        <label htmlFor="number" className="block text-sm font-medium">
          数字
        </label>
        <Input id="number" type="number" placeholder="12345" />
      </div>
    </div>
  ),
};
