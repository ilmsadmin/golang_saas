'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  SettingsIcon,
  DatabaseIcon,
  MailIcon,
  ShieldIcon,
  KeyIcon,
  ServerIcon,
  CreditCardIcon,
  BellIcon,
  UsersIcon,
  SaveIcon,
  RefreshCwIcon,
  TrashIcon,
  PlusIcon
} from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'json';
  category: string;
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  // Mock system settings
  const systemSettings: SystemSetting[] = [
    {
      id: '1',
      key: 'system.name',
      value: 'GoLang SaaS Platform',
      description: 'Tên hệ thống hiển thị',
      type: 'text',
      category: 'general'
    },
    {
      id: '2',
      key: 'system.version',
      value: '1.0.0',
      description: 'Phiên bản hệ thống',
      type: 'text',
      category: 'general'
    },
    {
      id: '3',
      key: 'auth.session_timeout',
      value: '3600',
      description: 'Thời gian hết hạn phiên (giây)',
      type: 'number',
      category: 'security'
    },
    {
      id: '4',
      key: 'email.smtp_host',
      value: 'smtp.gmail.com',
      description: 'SMTP Server Host',
      type: 'text',
      category: 'email'
    },
    {
      id: '5',
      key: 'email.smtp_port',
      value: '587',
      description: 'SMTP Server Port',
      type: 'number',
      category: 'email'
    },
    {
      id: '6',
      key: 'billing.trial_period',
      value: '14',
      description: 'Thời gian dùng thử (ngày)',
      type: 'number',
      category: 'billing'
    },
    {
      id: '7',
      key: 'notification.enabled',
      value: 'true',
      description: 'Bật thông báo hệ thống',
      type: 'boolean',
      category: 'notification'
    }
  ];

  const apiKeys = [
    {
      id: '1',
      name: 'Payment Gateway',
      key: 'pk_live_****',
      type: 'Stripe',
      status: 'active',
      lastUsed: '2024-06-14T10:30:00Z'
    },
    {
      id: '2',
      name: 'Email Service',
      key: 'sg_****',
      type: 'SendGrid',
      status: 'active',
      lastUsed: '2024-06-14T09:15:00Z'
    },
    {
      id: '3',
      name: 'Analytics',
      key: 'GA_****',
      type: 'Google Analytics',
      status: 'inactive',
      lastUsed: '2024-06-10T14:20:00Z'
    }
  ];

  const handleSaveSetting = (settingId: string, newValue: string) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log(`Saving setting ${settingId} with value:`, newValue);
      setIsLoading(false);
    }, 1000);
  };

  const handleBackup = () => {
    console.log('Creating system backup...');
  };

  const handleRestore = () => {
    console.log('Restoring from backup...');
  };

  const handleClearCache = () => {
    console.log('Clearing system cache...');
  };

  const renderSettingInput = (setting: SystemSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <Switch 
            defaultChecked={setting.value === 'true'} 
            onCheckedChange={(checked) => handleSaveSetting(setting.id, checked.toString())}
          />
        );
      case 'number':
        return (
          <Input 
            type="number" 
            defaultValue={setting.value}
            onBlur={(e) => handleSaveSetting(setting.id, e.target.value)}
          />
        );
      case 'json':
        return (
          <Textarea 
            defaultValue={setting.value}
            onBlur={(e) => handleSaveSetting(setting.id, e.target.value)}
            className="font-mono text-sm"
          />
        );
      default:
        return (
          <Input 
            defaultValue={setting.value}
            onBlur={(e) => handleSaveSetting(setting.id, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">
            Quản lý cấu hình và thiết lập hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBackup}>
            <DatabaseIcon className="h-4 w-4 mr-2" />
            Sao lưu
          </Button>
          <Button variant="outline" onClick={handleClearCache}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Xóa cache
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái hệ thống</CardTitle>
            <ServerIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Hoạt động</div>
            <p className="text-xs text-muted-foreground">Uptime: 99.9%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <DatabaseIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Kết nối</div>
            <p className="text-xs text-muted-foreground">Latency: 12ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <ServerIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">67%</div>
            <p className="text-xs text-muted-foreground">2.1GB / 3.2GB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <SettingsIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">1.2K</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Tổng quát</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="billing">Thanh toán</TabsTrigger>
          <TabsTrigger value="notification">Thông báo</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                Cài đặt chung
              </CardTitle>
              <CardDescription>Cấu hình cơ bản của hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemSettings.filter(s => s.category === 'general').map((setting) => (
                <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="text-sm font-medium">{setting.key}</Label>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <div className="md:col-span-2">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-4">
                <Button disabled={isLoading}>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldIcon className="h-5 w-5 mr-2" />
                Cài đặt bảo mật
              </CardTitle>
              <CardDescription>Cấu hình bảo mật và xác thực</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemSettings.filter(s => s.category === 'security').map((setting) => (
                <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="text-sm font-medium">{setting.key}</Label>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <div className="md:col-span-2">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Chính sách mật khẩu</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-length">Độ dài tối thiểu</Label>
                    <Input id="min-length" type="number" defaultValue="8" />
                  </div>
                  <div>
                    <Label htmlFor="require-special">Yêu cầu ký tự đặc biệt</Label>
                    <Switch id="require-special" defaultChecked />
                  </div>
                </div>
              </div>
              
              <Button>
                <SaveIcon className="h-4 w-4 mr-2" />
                Lưu cài đặt bảo mật
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MailIcon className="h-5 w-5 mr-2" />
                Cài đặt Email
              </CardTitle>
              <CardDescription>Cấu hình SMTP và email templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemSettings.filter(s => s.category === 'email').map((setting) => (
                <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="text-sm font-medium">{setting.key}</Label>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <div className="md:col-span-2">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">SMTP Authentication</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp-user">Username</Label>
                    <Input id="smtp-user" placeholder="username@domain.com" />
                  </div>
                  <div>
                    <Label htmlFor="smtp-pass">Password</Label>
                    <Input id="smtp-pass" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <Button variant="outline">
                  <MailIcon className="h-4 w-4 mr-2" />
                  Test Email Connection
                </Button>
              </div>
              
              <Button>
                <SaveIcon className="h-4 w-4 mr-2" />
                Lưu cài đặt email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Cài đặt thanh toán
              </CardTitle>
              <CardDescription>Cấu hình gateway thanh toán và billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemSettings.filter(s => s.category === 'billing').map((setting) => (
                <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="text-sm font-medium">{setting.key}</Label>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <div className="md:col-span-2">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Payment Gateways</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCardIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Stripe</p>
                        <p className="text-sm text-muted-foreground">Credit cards, ACH, more</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <CreditCardIcon className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-sm text-muted-foreground">PayPal, credit cards</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              <Button>
                <SaveIcon className="h-4 w-4 mr-2" />
                Lưu cài đặt thanh toán
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                Cài đặt thông báo
              </CardTitle>
              <CardDescription>Cấu hình thông báo và alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemSettings.filter(s => s.category === 'notification').map((setting) => (
                <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="text-sm font-medium">{setting.key}</Label>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <div className="md:col-span-2">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                <div className="space-y-3">
                  {[
                    { name: 'New Tenant Registration', enabled: true },
                    { name: 'Payment Failed', enabled: true },
                    { name: 'Subscription Canceled', enabled: true },
                    { name: 'System Errors', enabled: true },
                    { name: 'Daily Reports', enabled: false },
                    { name: 'Weekly Summary', enabled: false }
                  ].map((notification, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{notification.name}</p>
                      </div>
                      <Switch defaultChecked={notification.enabled} />
                    </div>
                  ))}
                </div>
              </div>
              
              <Button>
                <SaveIcon className="h-4 w-4 mr-2" />
                Lưu cài đặt thông báo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <KeyIcon className="h-5 w-5 mr-2" />
                API Keys Management
              </CardTitle>
              <CardDescription>Quản lý API keys và integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Active API Keys</h4>
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add New Key
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((apiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell className="font-medium">{apiKey.name}</TableCell>
                        <TableCell>{apiKey.type}</TableCell>
                        <TableCell className="font-mono text-sm">{apiKey.key}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={apiKey.status === 'active' ? 'default' : 'secondary'}
                            className={apiKey.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {apiKey.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(apiKey.lastUsed).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <RefreshCwIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
