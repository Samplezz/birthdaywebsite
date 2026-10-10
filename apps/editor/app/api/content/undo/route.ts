import { NextResponse } from 'next/server';
import { undoLastPublish, hasUndoHistory } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const canUndo = await hasUndoHistory();
    return NextResponse.json({ canUndo });
  } catch (err) {
    return NextResponse.json({ canUndo: false });
  }
}

export async function POST() {
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
