import React from 'react';
import { Badge } from './Badge';

export default {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: {
        type: 'select',
        options: ['default', 'secondary', 'outline', 'destructive', 'success', 'warning', 'info'],
      },
    },
  },
};

export const Default = {
  args: {
    variant: 'default',
    children: 'Default Badge',
  },
};

export const Secondary = {
  args: {
    variant: 'secondary',
    children: 'Secondary Badge',
  },
};

export const Outline = {
  args: {
    variant: 'outline',
    children: 'Outline Badge',
  },
};

export const Destructive = {
  args: {
    variant: 'destructive',
    children: 'Destructive Badge',
  },
};

export const Success = {
  args: {
    variant: 'success',
    children: 'Success Badge',
  },
};

export const Warning = {
  args: {
    variant: 'warning',
    children: 'Warning Badge',
  },
};

export const Info = {
  args: {
    variant: 'info',
    children: 'Info Badge',
  },
};

export const Small = {
  args: {
    children: 'Small Badge',
    className: 'text-xs px-2 py-0.5',
  },
};

export const Large = {
  args: {
    children: 'Large Badge',
    className: 'text-lg px-4 py-1',
  },
};
