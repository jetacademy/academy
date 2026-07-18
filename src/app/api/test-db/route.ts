import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        isActive: true,
      },
    });
    return NextResponse.json({
      success: true,
      dbName: process.env.DATABASE_URL?.split("/").pop()?.split("?")[0],
      count: programs.length,
      programs,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || err,
    }, { status: 500 });
  }
}
