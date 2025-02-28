import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';

interface Folder {
  id: number;
  name: string;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
}

interface Bookmark {
  id: number;
  url: string;
  title: string;
  description?: string;
  folderId?: number;
  createdAt: string;
  updatedAt: string;
}

interface BookmarkTree {
  folders: Record<number, Folder>;
  bookmarks: Record<number, Bookmark>;
  rootFolders: number[];
  folderChildren: Record<number, { folders: number[]; bookmarks: number[]; }>;
}

export function useBookmarks() {
  const [tree, setTree] = useState<BookmarkTree>({
    folders: {},
    bookmarks: {},
    rootFolders: [],
    folderChildren: {},
  });

  const { data: bookmarks, loading, error, get, post, put, delete: del } = useApi<any[]>();

  // ツリーの構築
  const buildTree = useCallback((folders: Folder[], bookmarks: Bookmark[]) => {
    const tree: BookmarkTree = {
      folders: {},
      bookmarks: {},
      rootFolders: [],
      folderChildren: {},
    };

    // フォルダーの初期化
    folders.forEach((folder) => {
      tree.folders[folder.id] = folder;
      tree.folderChildren[folder.id] = { folders: [], bookmarks: [] };
      if (!folder.parentId) {
        tree.rootFolders.push(folder.id);
      }
    });

    // フォルダー階層の構築
    folders.forEach((folder) => {
      if (folder.parentId && tree.folderChildren[folder.parentId]) {
        tree.folderChildren[folder.parentId].folders.push(folder.id);
      }
    });

    // ブックマークの追加
    bookmarks.forEach((bookmark) => {
      tree.bookmarks[bookmark.id] = bookmark;
      if (bookmark.folderId && tree.folderChildren[bookmark.folderId]) {
        tree.folderChildren[bookmark.folderId].bookmarks.push(bookmark.id);
      }
    });

    setTree(tree);
  }, []);

  // データの取得
  const fetchBookmarks = useCallback(async () => {
    try {
      const [folders, bookmarks] = await Promise.all([
        get('/folders'),
        get('/bookmarks'),
      ]);
      buildTree(folders, bookmarks);
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    }
  }, [get, buildTree]);

  // 初期データの取得
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // フォルダーの作成
  const addFolder = useCallback(async (name: string, parentId?: number) => {
    try {
      const response = await post('/folders', { name, parentId });
      const folder = response as unknown as Folder;
      setTree((prev) => {
        const newTree = { ...prev };
        newTree.folders[folder.id] = folder;
        newTree.folderChildren[folder.id] = { folders: [], bookmarks: [] };
        if (!folder.parentId) {
          newTree.rootFolders.push(folder.id);
        } else if (newTree.folderChildren[folder.parentId]) {
          newTree.folderChildren[folder.parentId].folders.push(folder.id);
        }
        return newTree;
      });
      return folder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }, [post]);

  // フォルダーの更新
  const updateFolder = useCallback(async (id: number, name: string) => {
    try {
      const response = await put(`/folders/${id}`, { name });
      const folder = response as unknown as Folder;
      setTree((prev) => ({
        ...prev,
        folders: { ...prev.folders, [id]: folder },
      }));
      return folder;
    } catch (error) {
      console.error('Failed to update folder:', error);
      throw error;
    }
  }, [put]);

  // フォルダーの削除
  const deleteFolder = useCallback(async (id: number) => {
    try {
      await del(`/folders/${id}`);
      setTree((prev) => {
        const newTree = { ...prev };
        delete newTree.folders[id];
        delete newTree.folderChildren[id];
        newTree.rootFolders = newTree.rootFolders.filter((fId) => fId !== id);
        Object.values(newTree.folderChildren).forEach((children) => {
          children.folders = children.folders.filter((fId) => fId !== id);
        });
        return newTree;
      });
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  }, [del]);

  // ブックマークの作成
  const addBookmark = useCallback(async (url: string, title: string, description?: string, folderId?: number) => {
    try {
      const response = await post('/bookmarks', { url, title, description, folderId });
      const bookmark = response as unknown as Bookmark;
      setTree((prev) => {
        const newTree = { ...prev };
        newTree.bookmarks[bookmark.id] = bookmark;
        if (bookmark.folderId && newTree.folderChildren[bookmark.folderId]) {
          newTree.folderChildren[bookmark.folderId].bookmarks.push(bookmark.id);
        }
        return newTree;
      });
      return bookmark;
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      throw error;
    }
  }, [post]);

  // ブックマークの更新
  const updateBookmark = useCallback(async (id: number, data: Partial<Bookmark>) => {
    try {
      const response = await put(`/bookmarks/${id}`, data);
      const bookmark = response as unknown as Bookmark;
      setTree((prev) => {
        const newTree = { ...prev };
        const oldFolderId = prev.bookmarks[id]?.folderId;
        newTree.bookmarks[id] = bookmark;
        if (oldFolderId !== bookmark.folderId) {
          if (oldFolderId && newTree.folderChildren[oldFolderId]) {
            newTree.folderChildren[oldFolderId].bookmarks = newTree.folderChildren[oldFolderId].bookmarks.filter(
              (bId) => bId !== id
            );
          }
          if (bookmark.folderId && newTree.folderChildren[bookmark.folderId]) {
            newTree.folderChildren[bookmark.folderId].bookmarks.push(id);
          }
        }
        return newTree;
      });
      return bookmark;
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      throw error;
    }
  }, [put]);

  // ブックマークの削除
  const deleteBookmark = useCallback(async (id: number) => {
    try {
      await del(`/bookmarks/${id}`);
      setTree((prev) => {
        const newTree = { ...prev };
        const folderId = prev.bookmarks[id]?.folderId;
        delete newTree.bookmarks[id];
        if (folderId && newTree.folderChildren[folderId]) {
          newTree.folderChildren[folderId].bookmarks = newTree.folderChildren[folderId].bookmarks.filter(
            (bId) => bId !== id
          );
        }
        return newTree;
      });
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      throw error;
    }
  }, [del]);

  return {
    tree,
    loading,
    error,
    fetchBookmarks,
    addFolder,
    updateFolder,
    deleteFolder,
    addBookmark,
    updateBookmark,
    deleteBookmark,
  };
} 