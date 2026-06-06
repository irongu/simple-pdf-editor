import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  const defaultProps = {
    onOpenPdf: vi.fn(),
    onAppendPdf: vi.fn(),
    onRotateCW: vi.fn(),
    onRotateCCW: vi.fn(),
    onRotate180: vi.fn(),
    onFlipH: vi.fn(),
    onFlipV: vi.fn(),
    onExportPdf: vi.fn(),
    onExportSelected: vi.fn(),
    onDelete: vi.fn(),
    onReset: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    hasSelection: false,
    hasPages: false,
    flipHActive: false,
    flipVActive: false,
    canUndo: false,
    canRedo: false,
  };

  describe('file operations', () => {
    it('should render open PDF button always enabled', () => {
      render(<Toolbar {...defaultProps} />);
      const btn = screen.getByRole('button', { name: '打开 PDF' });
      expect(btn).not.toBeDisabled();
    });

    it('should call onOpenPdf when open button clicked', async () => {
      const onOpenPdf = vi.fn();
      render(<Toolbar {...defaultProps} onOpenPdf={onOpenPdf} />);
      await userEvent.click(screen.getByRole('button', { name: '打开 PDF' }));
      expect(onOpenPdf).toHaveBeenCalledTimes(1);
    });

    it('should disable append PDF button when no pages', () => {
      render(<Toolbar {...defaultProps} hasPages={false} />);
      const btn = screen.getByRole('button', { name: '追加 PDF' });
      expect(btn).toBeDisabled();
    });

    it('should enable append PDF button when has pages', () => {
      render(<Toolbar {...defaultProps} hasPages={true} />);
      const btn = screen.getByRole('button', { name: '追加 PDF' });
      expect(btn).not.toBeDisabled();
    });
  });

  describe('transform operations', () => {
    it('should disable rotate buttons when no selection', () => {
      render(<Toolbar {...defaultProps} hasSelection={false} />);
      expect(screen.getByRole('button', { name: '顺时针旋转 90°' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '逆时针旋转 90°' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '旋转 180°' })).toBeDisabled();
    });

    it('should enable rotate buttons when has selection', () => {
      render(<Toolbar {...defaultProps} hasSelection={true} />);
      expect(screen.getByRole('button', { name: '顺时针旋转 90°' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: '逆时针旋转 90°' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: '旋转 180°' })).not.toBeDisabled();
    });

    it('should call onRotateCW when clicked', async () => {
      const onRotateCW = vi.fn();
      render(<Toolbar {...defaultProps} onRotateCW={onRotateCW} hasSelection={true} />);
      await userEvent.click(screen.getByRole('button', { name: '顺时针旋转 90°' }));
      expect(onRotateCW).toHaveBeenCalledTimes(1);
    });

    it('should call onRotateCCW when clicked', async () => {
      const onRotateCCW = vi.fn();
      render(<Toolbar {...defaultProps} onRotateCCW={onRotateCCW} hasSelection={true} />);
      await userEvent.click(screen.getByRole('button', { name: '逆时针旋转 90°' }));
      expect(onRotateCCW).toHaveBeenCalledTimes(1);
    });

    it('should call onRotate180 when clicked', async () => {
      const onRotate180 = vi.fn();
      render(<Toolbar {...defaultProps} onRotate180={onRotate180} hasSelection={true} />);
      await userEvent.click(screen.getByRole('button', { name: '旋转 180°' }));
      expect(onRotate180).toHaveBeenCalledTimes(1);
    });
  });

  describe('flip operations', () => {
    it('should disable flip buttons when no selection', () => {
      render(<Toolbar {...defaultProps} hasSelection={false} />);
      expect(screen.getByRole('button', { name: '水平镜像' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '垂直镜像' })).toBeDisabled();
    });

    it('should enable flip buttons when has selection', () => {
      render(<Toolbar {...defaultProps} hasSelection={true} />);
      expect(screen.getByRole('button', { name: '水平镜像' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: '垂直镜像' })).not.toBeDisabled();
    });

    it('should call onFlipH when clicked', async () => {
      const onFlipH = vi.fn();
      render(<Toolbar {...defaultProps} onFlipH={onFlipH} hasSelection={true} />);
      await userEvent.click(screen.getByRole('button', { name: '水平镜像' }));
      expect(onFlipH).toHaveBeenCalledTimes(1);
    });

    it('should call onFlipV when clicked', async () => {
      const onFlipV = vi.fn();
      render(<Toolbar {...defaultProps} onFlipV={onFlipV} hasSelection={true} />);
      await userEvent.click(screen.getByRole('button', { name: '垂直镜像' }));
      expect(onFlipV).toHaveBeenCalledTimes(1);
    });

    it('should show active ring on flipH button when flipHActive is true', () => {
      render(<Toolbar {...defaultProps} hasSelection={true} flipHActive={true} />);
      const btn = screen.getByRole('button', { name: '水平镜像' });
      expect(btn.className).toContain('ring-2');
      expect(btn.className).toContain('ring-apple-primary');
    });

    it('should show active ring on flipV button when flipVActive is true', () => {
      render(<Toolbar {...defaultProps} hasSelection={true} flipVActive={true} />);
      const btn = screen.getByRole('button', { name: '垂直镜像' });
      expect(btn.className).toContain('ring-2');
      expect(btn.className).toContain('ring-apple-primary');
    });

    it('should not show ring when flipHActive but no selection', () => {
      render(<Toolbar {...defaultProps} hasSelection={false} flipHActive={true} />);
      const btn = screen.getByRole('button', { name: '水平镜像' });
      expect(btn.className).not.toContain('ring-apple-primary');
    });
  });

  describe('export and actions', () => {
    it('should disable export PDF when no pages', () => {
      render(<Toolbar {...defaultProps} hasPages={false} />);
      expect(screen.getByRole('button', { name: '导出 PDF' })).toBeDisabled();
    });

    it('should enable export PDF when has pages', () => {
      render(<Toolbar {...defaultProps} hasPages={true} />);
      expect(screen.getByRole('button', { name: '导出 PDF' })).not.toBeDisabled();
    });

    it('should disable export selected when no selection', () => {
      render(<Toolbar {...defaultProps} hasSelection={false} />);
      expect(screen.getByRole('button', { name: '导出选中页面' })).toBeDisabled();
    });

    it('should disable delete when no selection', () => {
      render(<Toolbar {...defaultProps} hasSelection={false} />);
      expect(screen.getByRole('button', { name: '删除选中页面' })).toBeDisabled();
    });

    it('should disable reset when no selection', () => {
      render(<Toolbar {...defaultProps} hasSelection={false} />);
      expect(screen.getByRole('button', { name: '重置变换' })).toBeDisabled();
    });

    it('should call onExportPdf when clicked', async () => {
      const onExportPdf = vi.fn();
      render(<Toolbar {...defaultProps} onExportPdf={onExportPdf} hasPages={true} />);
      await userEvent.click(screen.getByRole('button', { name: '导出 PDF' }));
      expect(onExportPdf).toHaveBeenCalledTimes(1);
    });

    it('should call onExportSelected when clicked', async () => {
      const onExportSelected = vi.fn();
      render(<Toolbar {...defaultProps} onExportSelected={onExportSelected} hasSelection={true} />);
      await userEvent.click(screen.getByRole('button', { name: '导出选中页面' }));
      expect(onExportSelected).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when clicked', async () => {
      const onDelete = vi.fn();
      render(<Toolbar {...defaultProps} onDelete={onDelete} hasSelection={true} />);
      await userEvent.click(screen.getByRole('button', { name: '删除选中页面' }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should call onReset when clicked', async () => {
      const onReset = vi.fn();
      render(<Toolbar {...defaultProps} onReset={onReset} hasSelection={true} />);
      await userEvent.click(screen.getByRole('button', { name: '重置变换' }));
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('undo/redo', () => {
    it('should disable undo button when canUndo is false', () => {
      render(<Toolbar {...defaultProps} canUndo={false} />);
      expect(screen.getByRole('button', { name: '撤销' })).toBeDisabled();
    });

    it('should enable undo button when canUndo is true', () => {
      render(<Toolbar {...defaultProps} canUndo={true} />);
      expect(screen.getByRole('button', { name: '撤销' })).not.toBeDisabled();
    });

    it('should disable redo button when canRedo is false', () => {
      render(<Toolbar {...defaultProps} canRedo={false} />);
      expect(screen.getByRole('button', { name: '重做' })).toBeDisabled();
    });

    it('should enable redo button when canRedo is true', () => {
      render(<Toolbar {...defaultProps} canRedo={true} />);
      expect(screen.getByRole('button', { name: '重做' })).not.toBeDisabled();
    });

    it('should call onUndo when undo button clicked', async () => {
      const onUndo = vi.fn();
      render(<Toolbar {...defaultProps} onUndo={onUndo} canUndo={true} />);
      await userEvent.click(screen.getByRole('button', { name: '撤销' }));
      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('should call onRedo when redo button clicked', async () => {
      const onRedo = vi.fn();
      render(<Toolbar {...defaultProps} onRedo={onRedo} canRedo={true} />);
      await userEvent.click(screen.getByRole('button', { name: '重做' }));
      expect(onRedo).toHaveBeenCalledTimes(1);
    });
  });
});
