import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HEADERS = [
  'content-type',
  'content-length',
  'accept',
  'accept-encoding',
  'accept-language',
  'user-agent',
  'referer',
  'origin',
  'cookie',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site'
];

export async function GET(
  request: NextRequest,
  { params }: { params: { url: string[] } }
) {
  try {
    const targetUrl = params.url.join('/');
    console.log('プロキシリクエスト:', targetUrl);

    // URLの検証と修正
    let fullUrl = targetUrl;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `https://${fullUrl}`;
    }

    console.log('完全なURL:', fullUrl);

    // リクエストヘッダーの準備
    const headers = new Headers();
    // Array.fromでイテレーションの代わりに配列に変換してから処理
    Array.from(request.headers.entries()).forEach(([key, value]) => {
      if (ALLOWED_HEADERS.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // 必須ヘッダーの設定
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8');
    headers.set('Accept-Language', 'ja,en-US;q=0.7,en;q=0.3');
    headers.set('Upgrade-Insecure-Requests', '1');
    headers.set('Sec-Fetch-Dest', 'document');
    headers.set('Sec-Fetch-Mode', 'navigate');
    headers.set('Sec-Fetch-Site', 'none');
    headers.set('Sec-Fetch-User', '?1');

    // プロキシリクエストの実行
    console.log('プロキシリクエストを送信中...');
    const response = await fetch(fullUrl, {
      method: request.method,
      headers: headers,
      redirect: 'follow',
      cache: 'no-store',
    });

    console.log('プロキシレスポンスステータス:', response.status);
    console.log('レスポンスタイプ:', response.headers.get('Content-Type'));

    // レスポンスの処理
    const data = await response.blob();

    // レスポンスヘッダーの設定
    const responseHeaders = new Headers();

    // Array.fromでイテレーションの代わりに配列に変換してから処理
    Array.from(response.headers.entries()).forEach(([key, value]) => {
      if (!['content-encoding', 'content-length', 'content-security-policy', 'x-frame-options'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // CORSとセキュリティヘッダーの設定
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
    responseHeaders.set('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors 'self' *");

    // キャッシュ制御
    responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    responseHeaders.set('Pragma', 'no-cache');
    responseHeaders.set('Expires', '0');

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('プロキシエラー:', error);
    return NextResponse.json(
      { error: 'コンテンツの取得に失敗しました', details: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { url: string[] } }
) {
  return GET(request, { params });
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { url: string[] } }
) {
  return GET(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { url: string[] } }
) {
  return GET(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { url: string[] } }
) {
  return GET(request, { params });
}

export async function OPTIONS(
  request: NextRequest
) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    },
  });
} 