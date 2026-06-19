'use client';

import { useState, useEffect } from 'react';

type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'CONTENT_MANAGER' | null;

export function useAdminRole() {
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.role) {
          setRole(data.data.role);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isSuperAdmin = role === 'SUPER_ADMIN';

  return { role, loading, isSuperAdmin };
}
