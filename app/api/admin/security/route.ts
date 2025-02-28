import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { securitySettingsSchema } from "./schema";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const settings = await db.securitySettings.findFirst();

    if (!settings) {
      return new NextResponse("Settings not found", { status: 404 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[SECURITY_SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedSettings = securitySettingsSchema.parse(body);

    const settings = await db.securitySettings.upsert({
      where: {
        id: 1,
      },
      create: {
        ...validatedSettings,
      },
      update: {
        ...validatedSettings,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    console.error("[SECURITY_SETTINGS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedSettings = securitySettingsSchema.partial().parse(body);

    const settings = await db.securitySettings.update({
      where: {
        id: 1,
      },
      data: {
        ...validatedSettings,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    console.error("[SECURITY_SETTINGS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 