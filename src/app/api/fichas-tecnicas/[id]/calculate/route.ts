// src/app/api/fichas-tecnicas/[id]/calculate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { calculateRecipeCost } from "@/lib/services/recipe-cost.service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await calculateRecipeCost(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
