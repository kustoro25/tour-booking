import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireSuperAdmin } from '@/lib/auth';
import { revalidatePublicSite } from '@/lib/revalidate';

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }
    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdmin();
    const body = await request.json();

    // Update semua key sekaligus dalam satu transaksi (1 round-trip, bukan N). 
    // usd_rate dinormalkan ke angka bulat; nilai tidak wajar (=0/kosong) berarti
    // ikut kurs harian, bukan angka aneh seperti 16.5 karena salah ketik.
    const entries = Object.entries(body).map(([key, value]) => {
      if (key === 'usd_rate') {
        const rate = Math.round(Number(value));
        return [key, Number.isFinite(rate) && rate > 1000 ? rate : 0] as [string, unknown];
      }
      return [key, value] as [string, unknown];
    });
    await prisma.$transaction(
      entries.map(([key, value]) => {
        const serialized = JSON.stringify(value);
        return prisma.setting.upsert({
          where: { key },
          update: { value: serialized },
          create: { key, value: serialized },
        });
      })
    );

    revalidatePublicSite();
    return NextResponse.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden: Super Admin only') {
      return NextResponse.json({ success: false, error: 'Hanya Super Admin yang bisa mengubah pengaturan.' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
