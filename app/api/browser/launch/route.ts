import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // セッションの確認
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ブラウザプロセスの起動
    const { stdout, stderr } = await execAsync('cd /home/menchan/School-Hub/Browser/cef/build && ./browser');

    if (stderr) {
      console.error('ブラウザ起動エラー:', stderr);
      return NextResponse.json(
        { error: 'ブラウザの起動に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'ブラウザが正常に起動しました',
      output: stdout
    });

  } catch (error) {
    console.error('予期せぬエラーが発生しました:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    );
  }
} 