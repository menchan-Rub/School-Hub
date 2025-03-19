'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// パスワード変更フォームのバリデーションスキーマ
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: '現在のパスワードを入力してください' }),
  newPassword: z.string().min(8, { message: 'パスワードは8文字以上で入力してください' })
    .regex(/[A-Z]/, { message: 'パスワードには少なくとも1つの大文字を含める必要があります' })
    .regex(/[a-z]/, { message: 'パスワードには少なくとも1つの小文字を含める必要があります' })
    .regex(/[0-9]/, { message: 'パスワードには少なくとも1つの数字を含める必要があります' }),
  confirmPassword: z.string().min(1, { message: '確認用パスワードを入力してください' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

interface PasswordChangeFormProps {
  userId: string;
}

export default function PasswordChangeForm({ userId }: PasswordChangeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: PasswordChangeFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'パスワードの変更に失敗しました');
      }

      toast.success('パスワードを変更しました');
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'パスワードの変更に失敗しました');
      console.error('パスワード変更エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>現在のパスワード</FormLabel>
              <FormControl>
                <Input type="password" placeholder="現在のパスワード" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>新しいパスワード</FormLabel>
              <FormControl>
                <Input type="password" placeholder="新しいパスワード" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                パスワードは8文字以上で、大文字、小文字、数字を含める必要があります
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード確認</FormLabel>
              <FormControl>
                <Input type="password" placeholder="新しいパスワードを再入力" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'パスワードを変更中...' : 'パスワードを変更'}
        </Button>
      </form>
    </Form>
  );
} 