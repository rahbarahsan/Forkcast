import { Platform, Share } from 'react-native';

export async function shareText(title: string, message: string) {
  if (Platform.OS !== 'web' || typeof navigator.share === 'function') {
    await Share.share({ title, message });
  } else {
    downloadText(title + '.txt', message);
  }
}

export function downloadText(filename: string, content: string, type = 'text/plain') {
  if (Platform.OS !== 'web') return Share.share({ title: filename, message: content });
  const url = URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
