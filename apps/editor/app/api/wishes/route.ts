import { NextRequest, NextResponse } from 'next/server';
import { deleteWish, getWishes, setWishHidden, verifySessionToken } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

async function requireEditor(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('editor_session')?.value;
  return Boolean(token && await verifySessionToken(token, 'editor'));
}

export async function GET(req: NextRequest) {
  if (!(await requireEditor(req))) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

  try {
    return NextResponse.json({ wishes: await getWishes(true) });
  } catch (err) {
    console.error('Failed to load editor wishes:', err);
    return NextResponse.json({ error: 'Could not load wishes right now.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireEditor(req))) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (typeof body.id !== 'string' || typeof body.hidden !== 'boolean') {
      return NextResponse.json({ error: 'A wish ID and hidden state are required.' }, { status: 400 });
    }

    const wish = await setWishHidden(body.id, body.hidden);
    if (!wish) return NextResponse.json({ error: 'Wish not found.' }, { status: 404 });
    return NextResponse.json({ wish });
  } catch (err) {
    console.error('Failed to update wish:', err);
    return NextResponse.json({ error: 'Could not update that wish.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireEditor(req))) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'A wish ID is required.' }, { status: 400 });
    if (!(await deleteWish(id))) return NextResponse.json({ error: 'Wish not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete wish:', err);
    return NextResponse.json({ error: 'Could not delete that wish.' }, { status: 500 });
  }
}
