// Cek konten CMS Page yang menyimpan URL absolut (domain lama dll).
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const pages = await p.page.findMany({ select: { slug: true, content: true } });
  for (const page of pages) {
    if (!page.content) continue;
    const urls = page.content.match(/https?:\/\/[^\s"']+/g) || [];
    if (urls.length) console.log(page.slug, '=>', [...new Set(urls)].join('\n   '));
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
