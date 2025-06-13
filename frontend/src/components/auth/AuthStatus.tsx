'use client';

import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { Button } from '@/components/ui/Button';

export function AuthStatus() {
  const { user, loading, error } = useCurrentUser();
  const { logout, loading: logoutLoading } = useLogout();

  if (loading) {
    return <div className="animate-pulse">Đang tải...</div>;
  }

  if (error) {
    return <div className="text-red-600">Lỗi: {error.message}</div>;
  }

  if (!user) {
    return <div className="text-gray-600">Chưa đăng nhập</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Thông tin người dùng</h3>
      <div className="space-y-2 text-sm">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Tên:</strong> {user.firstName} {user.lastName}</p>
        <p><strong>Vai trò:</strong> {user.role.name}</p>
        {user.tenant && (
          <p><strong>Tenant:</strong> {user.tenant.name} ({user.tenant.slug})</p>
        )}
        <p><strong>Trạng thái:</strong> {user.isActive ? 'Hoạt động' : 'Không hoạt động'}</p>
        <p><strong>Quyền:</strong></p>
        <ul className="list-disc list-inside ml-4">
          {user.permissions.map((perm) => (
            <li key={perm.id}>{perm.resource}:{perm.action}</li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <Button
          onClick={() => logout()}
          loading={logoutLoading}
          variant="outline"
          size="sm"
        >
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
