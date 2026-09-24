// Compresses/resizes an image file in the browser before upload, since
// journal photos are only ever printed small in reports — there's no need
// to keep full camera-resolution files (often 3-10 MB) around.
export function compressImage(file: File, maxDimension = 1280, quality = 0.72): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Tidak bisa memproses gambar di browser ini.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (blob) resolve(blob);
            else reject(new Error('Gagal mengompresi gambar.'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('File bukan gambar yang valid.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(file);
  });
}

// Same compression as compressImage(), but starting from an existing base64
// data URL (used to migrate journal photos that were saved the old way,
// directly embedded in the database, into Supabase Storage instead).
export function compressDataUrl(dataUrl: string, maxDimension = 1280, quality = 0.72): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Tidak bisa memproses gambar di browser ini.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => {
          if (blob) resolve(blob);
          else reject(new Error('Gagal mengompresi gambar.'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Gagal memuat gambar lama (mungkin sudah rusak).'));
    img.src = dataUrl;
  });
}
