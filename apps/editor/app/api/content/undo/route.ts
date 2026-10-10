import { NextRequest, NextResponse } from 'next/server';
import { undoLastPublish, hasUndoHistory, verifySessionToken } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('editor_session')?.value;
  if (!token || !(await verifySessionToken(token, 'editor'))) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

  try {
    const canUndo = await hasUndoHistory();
    return NextResponse.json({ canUndo });
  } catch (err) {
    return NextResponse.json({ canUndo: false });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('editor_session')?.value;
  if (!token || !(await verifySessionToken(token, 'editor'))) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

  try {
    const restoredContent = await undoLastPublish();

    if (!restoredContent) {
      return NextResponse.json(
        { error: 'No previous published version found in history.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Restored previous published version successfully.',
      content: restoredContent,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to undo publish';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
