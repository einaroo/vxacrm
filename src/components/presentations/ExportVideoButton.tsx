'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportVideoButtonProps {
  slideCode: string;
  slideId?: string;
  presentationId?: string;
  className?: string;
}

export function ExportVideoButton({
  slideCode,
  slideId,
  presentationId,
  className,
}: ExportVideoButtonProps) {
  const [isRendering, setIsRendering] = useState(false);

  const handleExport = async () => {
    if (!slideCode) {
      toast.error('No slide code to export');
      return;
    }

    setIsRendering(true);
    toast.info('Rendering video... This may take a minute.');

    try {
      const response = await fetch('/api/presentations/render-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slideCode,
          slideId,
          presentationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to render video');
      }

      // Check if response is JSON (uploaded to storage) or video file
      const contentType = response.headers.get('Content-Type');

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        toast.success('Video rendered successfully!');

        // Open video in new tab
        if (data.videoUrl) {
          window.open(data.videoUrl, '_blank');
        }
      } else {
        // Download video file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slide-${slideId || Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Video downloaded!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export video');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isRendering || !slideCode}
      variant="outline"
      size="sm"
      className={className}
    >
      {isRendering ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Rendering...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export Video
        </>
      )}
    </Button>
  );
}
