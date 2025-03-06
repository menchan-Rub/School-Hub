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
    console.log('Proxying request to:', targetUrl);

    // URLの検証と修正
    let fullUrl = targetUrl;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `https://${fullUrl}`;
    }

    console.log('Full URL:', fullUrl);

    // リクエストヘッダーの準備
    const headers = new Headers();
    ALLOWED_HEADERS.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    });

    // User-Agentの設定
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // プロキシリクエストの設定
    const proxyRequest = new Request(fullUrl, {
      method: request.method,
      headers: headers,
      redirect: 'follow',
      cache: 'no-store',
    });

    // リクエストの実行
    console.log('Sending proxy request...');
    const response = await fetch(proxyRequest);
    console.log('Proxy response status:', response.status);

    // レスポンスの処理
    const data = await response.blob();
    console.log('Response content type:', response.headers.get('Content-Type'));

    // レスポンスヘッダーの設定
    const responseHeaders = new Headers();
    
    // オリジナルのヘッダーをコピー
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }

    // セキュリティヘッダーの設定
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
    responseHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    responseHeaders.delete('X-Frame-Options');  // iframeでの表示を許可
    responseHeaders.set('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' *");

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content', details: error instanceof Error ? error.message : 'Unknown error' },
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

export async function OPTIONS(
  request: NextRequest
) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    },
  });
} 