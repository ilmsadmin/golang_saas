'use client';

import React, { useState } from 'react';
import { useSystemModules } from '@/hooks/use-system';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHeadCell as TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  PlusIcon, 
  SearchIcon, 
  PencilIcon, 
  TrashIcon,
  SettingsIcon,
  PackageIcon 
} from 'lucide-react';

interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'inactive';
  category: string;
  permissions: string[];
  isCore: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ModulesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Mock data - replace with actual hook when backend is ready
  const { data: modules, loading, error } = useSystemModules();

  // Mock modules data
  const mockModules: Module[] = [
    {
      id: '1',
      name: 'User Management',
      description: 'Comprehensive user and role management system',
      version: '1.0.0',
      status: 'active',
      category: 'Core',
      permissions: ['users.read', 'users.create', 'users.update', 'users.delete'],
      isCore: true,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z'
    },
    {
      id: '2',
      name: 'Billing & Payments',
      description: 'Handle subscriptions, invoicing, and payment processing',
      version: '2.1.0',
      status: 'active',
      category: 'Business',
      permissions: ['billing.read', 'payments.process', 'invoices.manage'],
      isCore: false,
      createdAt: '2024-01-10T10:30:00Z',
      updatedAt: '2024-02-20T14:15:00Z'
    },
    {
      id: '3',
      name: 'Analytics Dashboard',
      description: 'Advanced analytics and reporting tools',
      version: '1.5.2',
      status: 'inactive',
      category: 'Analytics',
      permissions: ['analytics.read', 'reports.generate'],
      isCore: false,
      createdAt: '2024-01-05T12:00:00Z',
      updatedAt: '2024-03-01T09:45:00Z'
    },
    {
      id: '4',
      name: 'Email Notifications',
      description: 'Email template management and notification system',
      version: '1.2.1',
      status: 'active',
      category: 'Communication',
      permissions: ['emails.send', 'templates.manage'],
      isCore: false,
      createdAt: '2024-02-01T15:20:00Z',
      updatedAt: '2024-02-15T11:30:00Z'
    }
  ];

  const categories = ['all', 'Core', 'Business', 'Analytics', 'Communication', 'Integration'];

  const filteredModules = mockModules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setIsEditDialogOpen(true);
  };

  const handleDeleteModule = (moduleId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa module này?')) {
      console.log('Delete module:', moduleId);
      // Implement delete logic
    }
  };

  const handleToggleStatus = (moduleId: string, currentStatus: string) => {
    console.log('Toggle status for module:', moduleId, 'from', currentStatus);
    // Implement status toggle logic
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Module</h1>
          <p className="text-muted-foreground">
            Quản lý các module và tính năng của hệ thống
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Thêm Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Module Mới</DialogTitle>
              <DialogDescription>
                Tạo module mới cho hệ thống
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên Module</Label>
                <Input id="name" placeholder="Nhập tên module..." />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" placeholder="Mô tả chức năng..." />
              </div>
              <div>
                <Label htmlFor="category">Danh mục</Label>
                <select className="w-full p-2 border rounded-md">
                  <option value="Core">Core</option>
                  <option value="Business">Business</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Communication">Communication</option>
                  <option value="Integration">Integration</option>
                </select>
              </div>
              <div>
                <Label htmlFor="version">Phiên bản</Label>
                <Input id="version" placeholder="1.0.0" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="active" />
                <Label htmlFor="active">Kích hoạt ngay</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Tạo Module</Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Module</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockModules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Module Hoạt động</CardTitle>
            <SettingsIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockModules.filter(m => m.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Module Core</CardTitle>
            <PackageIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockModules.filter(m => m.isCore).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Danh Mục</CardTitle>
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(mockModules.map(m => m.category)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm module..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                className="w-full p-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Tất cả danh mục' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Module</CardTitle>
          <CardDescription>
            Hiển thị {filteredModules.length} module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Module</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Phiên bản</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{module.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {module.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{module.category}</Badge>
                  </TableCell>
                  <TableCell>{module.version}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={module.status === 'active' ? 'default' : 'secondary'}
                      className={module.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {module.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {module.isCore ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Core
                      </Badge>
                    ) : (
                      <Badge variant="outline">Add-on</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(module.updatedAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(module.id, module.status)}
                      >
                        <Switch 
                          checked={module.status === 'active'} 
                          className="h-4 w-4" 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditModule(module)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      {!module.isCore && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteModule(module.id)}
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Module</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin module
            </DialogDescription>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Tên Module</Label>
                <Input id="edit-name" defaultValue={selectedModule.name} />
              </div>
              <div>
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea id="edit-description" defaultValue={selectedModule.description} />
              </div>
              <div>
                <Label htmlFor="edit-version">Phiên bản</Label>
                <Input id="edit-version" defaultValue={selectedModule.version} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="edit-active" defaultChecked={selectedModule.status === 'active'} />
                <Label htmlFor="edit-active">Kích hoạt</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Cập nhật</Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
