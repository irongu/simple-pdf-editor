export interface PageInfo {
  id: string;
  sourcePdfIndex: number;
  sourcePageIndex: number;
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
}

export interface PdfSource {
  name: string;
  bytes: ArrayBuffer;
  pageCount: number;
}

export interface ThumbnailData {
  pageId: string;
  imageUrl: string;
  width: number;
  height: number;
}
