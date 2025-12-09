import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Typography,
} from '../components/ui';

const UIPreviewPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <Typography variant="h1" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            UI Component Library
          </Typography>
          <Typography variant="body" className="text-slate-400">
            Preview of all CVA-powered UI components
          </Typography>
          <Badge variant="info">Development Mode Only</Badge>
        </div>

        {/* Button Section */}
        <section className="space-y-6">
          <Typography variant="h2" className="border-b border-slate-700 pb-2">
            Buttons
          </Typography>
          
          <div className="space-y-4">
            <div>
              <Typography variant="h4" className="mb-3">Variants</Typography>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>

            <div>
              <Typography variant="h4" className="mb-3">Sizes</Typography>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Card Section */}
        <section className="space-y-6">
          <Typography variant="h2" className="border-b border-slate-700 pb-2">
            Cards
          </Typography>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card with border</CardDescription>
              </CardHeader>
              <CardContent>
                <Typography variant="body">
                  This is the default card variant with basic styling.
                </Typography>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">Learn More</Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Card with shadow effect</CardDescription>
              </CardHeader>
              <CardContent>
                <Typography variant="body">
                  This card has a subtle shadow for elevation effect.
                </Typography>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="primary">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Bordered Card</CardTitle>
                <CardDescription>Card with highlighted border</CardDescription>
              </CardHeader>
              <CardContent>
                <Typography variant="body">
                  This card features a prominent border with hover effect.
                </Typography>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="ghost">Explore</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Badge Section */}
        <section className="space-y-6">
          <Typography variant="h2" className="border-b border-slate-700 pb-2">
            Badges
          </Typography>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Badge Examples
                <Badge variant="success">Active</Badge>
              </CardTitle>
              <CardDescription>Badges can be used inline with text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Typography variant="body">Status:</Typography>
                <Badge variant="success">Online</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Typography variant="body">Priority:</Typography>
                <Badge variant="warning">Medium</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Typography variant="body">Type:</Typography>
                <Badge variant="info">Feature</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Input Section */}
        <section className="space-y-6">
          <Typography variant="h2" className="border-b border-slate-700 pb-2">
            Inputs
          </Typography>
          
          <div className="space-y-4 max-w-md">
            <div>
              <Typography variant="h4" className="mb-3">Sizes</Typography>
              <div className="space-y-3">
                <Input 
                  size="sm" 
                  placeholder="Small input" 
                />
                <Input 
                  size="md" 
                  placeholder="Medium input (default)" 
                />
                <Input 
                  size="lg" 
                  placeholder="Large input" 
                />
              </div>
            </div>

            <div>
              <Typography variant="h4" className="mb-3">States</Typography>
              <div className="space-y-3">
                <Input 
                  state="default" 
                  placeholder="Default state" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Input 
                  state="error" 
                  placeholder="Error state" 
                  value="Invalid input"
                  readOnly
                />
                <Input 
                  disabled 
                  placeholder="Disabled state" 
                />
              </div>
            </div>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Form Example</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Email</label>
                  <Input type="email" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Password</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="primary">Submit</Button>
                <Button variant="ghost">Cancel</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-6">
          <Typography variant="h2" className="border-b border-slate-700 pb-2">
            Typography
          </Typography>
          
          <div className="space-y-4">
            <Typography variant="h1">Heading 1</Typography>
            <Typography variant="h2">Heading 2</Typography>
            <Typography variant="h3">Heading 3</Typography>
            <Typography variant="h4">Heading 4</Typography>
            <Typography variant="body">
              Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Typography>
            <Typography variant="caption">
              Caption text - Small descriptive text for additional information
            </Typography>
          </div>

          <Card variant="elevated">
            <CardHeader>
              <Typography variant="h3" as="div">Custom Typography</Typography>
              <Typography variant="caption">Using the 'as' prop for semantic HTML</Typography>
            </CardHeader>
            <CardContent>
              <Typography variant="body">
                The Typography component allows you to change the underlying HTML element 
                while maintaining consistent styling through variants.
              </Typography>
            </CardContent>
          </Card>
        </section>

        {/* Combined Example */}
        <section className="space-y-6">
          <Typography variant="h2" className="border-b border-slate-700 pb-2">
            Combined Example
          </Typography>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Project Status</CardTitle>
                  <Badge variant="success">Active</Badge>
                </div>
                <CardDescription>Overview of current project metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Typography variant="body">Tasks Completed</Typography>
                    <Badge variant="info">24/30</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="body">Issues Open</Typography>
                    <Badge variant="warning">3</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="body">Critical Bugs</Typography>
                    <Badge variant="error">1</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm" variant="primary">View Details</Button>
                <Button size="sm" variant="outline">Export Report</Button>
              </CardFooter>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="primary">Create New Post</Button>
                <Button className="w-full" variant="secondary">Upload Media</Button>
                <Button className="w-full" variant="outline">Manage Settings</Button>
                <Button className="w-full" variant="ghost">View Analytics</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-slate-700">
          <Typography variant="caption">
            Built with class-variance-authority, clsx, and tailwind-merge
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default UIPreviewPage;
