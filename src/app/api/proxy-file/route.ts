import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return NextResponse.json({ error: 'URL query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file from remote source: ${response.statusText}` },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition);
    }

    return new NextResponse(blob, { status: 200, headers });
  } catch (error: any) {
    console.error('Error proxying file:', error);
    return NextResponse.json(
      { error: 'Failed to proxy file', details: error.message },
      { status: 500 }
    );
  }
}
