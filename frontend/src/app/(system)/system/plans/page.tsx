'use client';

import React, { useState } from 'react';
import { usePlans, useDeletePlan } from '@/lib/graphql/hooks';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHeadCell, TableCell, EmptyTableState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmationModal } from '@/components/ui/Modal';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Plan } from '@/types/graphql';
import Link from 'next/link';

export default function PlansManagement() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: plansData, loading: plansLoading, refetch } = usePlans();
  const { deletePlan, loading: deleteLoading } = useDeletePlan();

  const handleViewDetails = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowDetails(true);
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    
    try {
      const result = await deletePlan(selectedPlan.id);
      if (result.success) {
        setShowDeleteConfirm(false);
        setSelectedPlan(null);
        refetch();
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  return (
    <ProtectedRoute requiredRole={['system_admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quản lý Plans</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Quản lý các gói cước cho tenants
                  </p>
                </div>
                <PermissionGuard resource="plans" action="create">
                  <Link href="/system/plans/create">
                    <Button>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tạo Plan mới
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Plans Table */}
          <Card>
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeadCell>Tên</TableHeadCell>
                    <TableHeadCell>Giá</TableHeadCell>
                    <TableHeadCell>Max Users</TableHeadCell>
                    <TableHeadCell>Subscriptions</TableHeadCell>
                    <TableHeadCell>Ngày tạo</TableHeadCell>
                    <TableHeadCell>Thao tác</TableHeadCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plansLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-2 py-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : plansData?.length ? (
                    plansData.map((plan: Plan) => (
                      <TableRow key={plan.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                            <div className="text-sm text-gray-500">{plan.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">
                            ${plan.price}/tháng
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {plan.maxUsers} users
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {plan.subscriptions?.length || 0} tenants
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(plan.createdAt).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(plan)}
                            >
                              Xem
                            </Button>
                            <PermissionGuard resource="plans" action="update">
                              <Link href={`/system/plans/${plan.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                  Sửa
                                </Button>
                              </Link>
                            </PermissionGuard>
                            <PermissionGuard resource="plans" action="delete">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                                disabled={plan.subscriptions && plan.subscriptions.length > 0}
                              >
                                Xóa
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyTableState
                      title="Không có plans"
                      description="Chưa có plan nào được tạo"
                      action={
                        <PermissionGuard resource="plans" action="create">
                          <Link href="/system/plans/create">
                            <Button>Tạo Plan đầu tiên</Button>
                          </Link>
                        </PermissionGuard>
                      }
                      icon={
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      }
                    />
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Plan Details Modal */}
        {selectedPlan && (
          <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} size="lg">
            <ModalHeader onClose={() => setShowDetails(false)}>
              <h3 className="text-lg font-semibold text-gray-900">Chi tiết Plan</h3>
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPlan.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giá</label>
                  <p className="mt-1 text-sm text-gray-900">${selectedPlan.price}/tháng</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Users</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPlan.maxUsers} users</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subscriptions</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPlan.subscriptions?.length || 0} tenants</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPlan.description || 'Không có mô tả'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPlan.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cập nhật lần cuối</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPlan.updatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              
              {selectedPlan.features && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedPlan.features, null, 2)}
                  </pre>
                </div>
              )}

              {selectedPlan.subscriptions && selectedPlan.subscriptions.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenants đang sử dụng ({selectedPlan.subscriptions.length})
                  </label>
                  <div className="space-y-2">
                    {selectedPlan.subscriptions.map((subscription, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-900">
                          {subscription.tenant?.name || `Tenant ${subscription.tenantId}`}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Đóng
              </Button>
              <PermissionGuard resource="plans" action="update">
                <Link href={`/system/plans/${selectedPlan.id}/edit`}>
                  <Button>Chỉnh sửa</Button>
                </Link>
              </PermissionGuard>
            </ModalFooter>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeletePlan}
          title="Xóa Plan"
          message={`Bạn có chắc chắn muốn xóa plan "${selectedPlan?.name}"? Hành động này không thể hoàn tác.`}
          confirmText="Xóa"
          cancelText="Hủy"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    </ProtectedRoute>
  );
}