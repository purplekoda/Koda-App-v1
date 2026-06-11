export async function GET() {
  const key = process.env.GOOGLE_AI_API_KEY
  return Response.json({
    exists: !!key,
    length: key?.length ?? 0,
    starts: key?.slice(0, 4) ?? 'none',
    ends: key?.slice(-4) ?? 'none',
    hasQuotes: key?.startsWith('"') || key?.startsWith("'") || false,
    hasSpaces: key !== key?.trim() || false,
  })
}
