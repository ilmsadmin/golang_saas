'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeadCell as TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  UsersIcon,
  BuildingIcon,
  DollarSignIcon,
  ActivityIcon,
  DownloadIcon,
  CalendarIcon,
  PieChartIcon
} from 'lucide-react';

interface SystemStats {
  totalTenants: number;
  totalUsers: number;
  totalRevenue: number;
  activeSubscriptions: number;
  growthRate: number;
  churnRate: number;
}

interface TenantReport {
  id: string;
  name: string;
  plan: string;
  users: number;
  revenue: number;
  status: string;
  lastActive: string;
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedReport, setSelectedReport] = useState('overview');

  // Mock data
  const systemStats: SystemStats = {
    totalTenants: 156,
    totalUsers: 2847,
    totalRevenue: 45600,
    activeSubscriptions: 142,
    growthRate: 12.5,
    churnRate: 3.2
  };

  const recentActivity = [
    { date: '2024-06-14', event: 'Tenant mới đăng ký', tenant: 'Tech Corp', amount: 299 },
    { date: '2024-06-14', event: 'Nâng cấp gói', tenant: 'StartupX', amount: 799 },
    { date: '2024-06-13', event: 'Thanh toán thành công', tenant: 'BigCorp Ltd', amount: 1599 },
    { date: '2024-06-13', event: 'Tenant hủy đăng ký', tenant: 'SmallBiz', amount: -199 },
    { date: '2024-06-12', event: 'Tenant mới đăng ký', tenant: 'GrowthCo', amount: 599 },
  ];

  const topTenants: TenantReport[] = [
    {
      id: '1',
      name: 'Enterprise Corp',
      plan: 'Enterprise',
      users: 250,
      revenue: 2499,
      status: 'active',
      lastActive: '2024-06-14T10:30:00Z'
    },
    {
      id: '2',
      name: 'TechStart Inc',
      plan: 'Professional',
      users: 85,
      revenue: 799,
      status: 'active',
      lastActive: '2024-06-14T09:15:00Z'
    },
    {
      id: '3',
      name: 'Global Solutions',
      plan: 'Enterprise',
      users: 180,
      revenue: 2499,
      status: 'active',
      lastActive: '2024-06-13T16:45:00Z'
    },
    {
      id: '4',
      name: 'Innovation Hub',
      plan: 'Professional',
      users: 65,
      revenue: 799,
      status: 'trial',
      lastActive: '2024-06-13T14:20:00Z'
    },
    {
      id: '5',
      name: 'Digital Agency',
      plan: 'Business',
      users: 45,
      revenue: 299,
      status: 'active',
      lastActive: '2024-06-12T11:00:00Z'
    }
  ];

  const monthlyData = [
    { month: 'Jan', tenants: 45, revenue: 12500, users: 850 },
    { month: 'Feb', tenants: 52, revenue: 14200, users: 980 },
    { month: 'Mar', tenants: 58, revenue: 16800, users: 1150 },
    { month: 'Apr', tenants: 67, revenue: 19400, users: 1320 },
    { month: 'May', tenants: 78, revenue: 22100, users: 1580 },
    { month: 'Jun', tenants: 89, revenue: 25600, users: 1820 }
  ];

  const handleExportReport = (type: string) => {
    console.log('Exporting report:', type);
    // Implement export logic
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo & Thống kê</h1>
          <p className="text-muted-foreground">
            Phân tích và báo cáo hiệu suất hệ thống
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày qua</SelectItem>
              <SelectItem value="30d">30 ngày qua</SelectItem>
              <SelectItem value="90d">3 tháng qua</SelectItem>
              <SelectItem value="1y">1 năm qua</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Tenant</CardTitle>
            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalTenants}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUpIcon className="h-3 w-3 mr-1" />
              +{systemStats.growthRate}% so với tháng trước
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Người dùng</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUpIcon className="h-3 w-3 mr-1" />
              +15.2% so với tháng trước
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${systemStats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUpIcon className="h-3 w-3 mr-1" />
              +8.7% so với tháng trước
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đăng ký hoạt động</CardTitle>
            <ActivityIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemStats.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ rời bỏ</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{systemStats.churnRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="tenants">Tenant</TabsTrigger>
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3Icon className="h-5 w-5 mr-2" />
                  Biểu đồ tăng trưởng
                </CardTitle>
                <CardDescription>Tenant và doanh thu theo tháng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Biểu đồ sẽ hiển thị ở đây</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Tenants */}
            <Card>
              <CardHeader>
                <CardTitle>Top Tenant</CardTitle>
                <CardDescription>Tenant có doanh thu cao nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topTenants.slice(0, 5).map((tenant, index) => (
                    <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-gray-500">{tenant.plan}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${tenant.revenue}</p>
                        <p className="text-sm text-gray-500">{tenant.users} users</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo Tenant</CardTitle>
              <CardDescription>Thống kê chi tiết về các tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Gói</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Doanh thu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hoạt động cuối</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tenant.plan}</Badge>
                      </TableCell>
                      <TableCell>{tenant.users}</TableCell>
                      <TableCell>${tenant.revenue}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={tenant.status === 'active' ? 'default' : 'secondary'}
                          className={tenant.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {tenant.status === 'active' ? 'Hoạt động' : 'Thử nghiệm'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(tenant.lastActive).toLocaleDateString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Doanh thu theo tháng</CardTitle>
                <CardDescription>Biểu đồ doanh thu 6 tháng gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3Icon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Biểu đồ doanh thu sẽ hiển thị ở đây</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phân tích doanh thu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Doanh thu trung bình/tháng</span>
                    <span className="font-medium">$18,267</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Doanh thu cao nhất</span>
                    <span className="font-medium">$25,600</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Tăng trưởng trung bình</span>
                    <span className="font-medium text-green-600">+15.8%</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="w-full" onClick={() => handleExportReport('revenue')}>
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Xuất báo cáo doanh thu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>Các sự kiện quan trọng trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.event}</p>
                        <p className="text-sm text-gray-500">{activity.tenant}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {activity.amount > 0 ? '+' : ''}${Math.abs(activity.amount)}
                      </p>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
