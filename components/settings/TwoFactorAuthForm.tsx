'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// 認証コード確認フォームのバリデーションスキーマ
const verificationSchema = z.object({
  code: z.string().min(6, { message: '認証コードは6桁で入力してください' }).max(6),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

interface TwoFactorAuthFormProps {
  userId: string;
}

export default function TwoFactorAuthForm({ userId }: TwoFactorAuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  // 現在の2FA状態をロード
  useEffect(() => {
    const loadTwoFactorStatus = async () => {
      try {
        const response = await fetch('/api/user/2fa/status');
        const data = await response.json();
        
        if (response.ok) {
          setIsTwoFactorEnabled(data.enabled);
        }
      } catch (error) {
        console.error('2FA状態の読み込みに失敗しました:', error);
      }
    };

    loadTwoFactorStatus();
  }, []);

  // 2FAの有効化/無効化を切り替え
  const handleToggle = async (enabled: boolean) => {
    if (enabled && !isTwoFactorEnabled) {
      // 有効化する場合
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/2fa/setup', {
          method: 'POST',
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setQrCodeUrl(data.qrCodeUrl);
          setSecret(data.secret);
          setShowVerification(true);
        } else {
          toast.error(data.message || '2FAの設定に失敗しました');
        }
      } catch (error) {
        toast.error('2FAの設定に失敗しました');
        console.error('2FAセットアップエラー:', error);
      } finally {
        setIsLoading(false);
      }
    } else if (!enabled && isTwoFactorEnabled) {
      // 無効化する場合
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/2fa/disable', {
          method: 'POST',
        });
        
        if (response.ok) {
          setIsTwoFactorEnabled(false);
          toast.success('二段階認証を無効化しました');
          setShowVerification(false);
        } else {
          const data = await response.json();
          toast.error(data.message || '2FAの無効化に失敗しました');
        }
      } catch (error) {
        toast.error('2FAの無効化に失敗しました');
        console.error('2FA無効化エラー:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 認証コードの確認
  async function onSubmit(data: VerificationFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: data.code,
          secret,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '認証コードの確認に失敗しました');
      }

      setIsTwoFactorEnabled(true);
      setShowVerification(false);
      toast.success('二段階認証を有効化しました');
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '認証コードの確認に失敗しました');
      console.error('認証コード確認エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">二段階認証</p>
          <p className="text-sm text-muted-foreground">
            アカウントをより安全に保護します
          </p>
        </div>
        <Switch
          checked={isTwoFactorEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading || showVerification}
          aria-label="二段階認証の切り替え"
        />
      </div>

      {showVerification && qrCodeUrl && (
        <Card>
          <CardHeader>
            <CardTitle>二段階認証の設定</CardTitle>
            <CardDescription>
              認証アプリでQRコードをスキャンし、表示される認証コードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-48 h-48 relative border p-2">
                <img 
                  src={qrCodeUrl} 
                  alt="Authentication QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-center">
                QRコードをスキャンできない場合は、以下のコードを手動で入力してください：
              </p>
              <code className="bg-muted p-2 rounded text-sm font-mono">
                {secret}
              </code>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>認証コード</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="6桁の認証コード"
                          {...field}
                          maxLength={6}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowVerification(false)}
                    disabled={isLoading}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? '確認中...' : '確認する'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {isTwoFactorEnabled && !showVerification && (
        <div className="text-sm p-4 border rounded-md bg-muted">
          <p>
            二段階認証が有効になっています。ログイン時にはパスワードに加えて認証コードの入力が必要です。
          </p>
        </div>
      )}
    </div>
  );
} 