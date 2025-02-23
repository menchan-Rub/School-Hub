"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";

export function MessageFileModal() {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen && type === "messageFile";
  const { apiUrl, query } = data;

  const onFileUpload = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(apiUrl!, {
        method: "POST",
        body: JSON.stringify({
          fileUrl: url,
          ...query
        })
      });

      if (!response.ok) {
        throw new Error("ファイルのアップロードに失敗しました");
      }

      router.refresh();
      handleClose();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            ファイルを追加
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            メッセージにファイルを添付します
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <FileUpload
            endpoint="messageFile"
            value=""
            onChange={onFileUpload}
          />
        </div>
        <DialogFooter className="bg-gray-100 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button
              disabled={isLoading}
              onClick={handleClose}
              variant="ghost"
            >
              キャンセル
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}