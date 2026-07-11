const fs = require('fs');
let code = fs.readFileSync('src/components/GalleryBlock.tsx', 'utf8');

const newImageHandler = `
      filesArray.forEach((file) => {
        const compressImage = (imageFile) => {
          const img = new Image();
          img.src = URL.createObjectURL(imageFile);
          img.onload = () => {
            const canvas = document.createElement("canvas");
            // Standardize max width for gallery/scrapbook
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height *= MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width *= MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.8 quality
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
            loadedUrls.push(compressedDataUrl);
            loadedCount++;
            if (loadedCount === filesArray.length) {
              handleAddUrls(loadedUrls);
            }
          };
          img.onerror = () => {
             loadedCount++;
             if (loadedCount === filesArray.length) {
               handleAddUrls(loadedUrls);
             }
          };
        };
        compressImage(file);
`;

code = code.replace(/filesArray\.forEach\(\(file\) => \{\n\s*const reader = new FileReader\(\);\n\s*reader\.onload = \(event\) => \{\n\s*const dataUrl = event\.target\?\.result as string;\n\s*if \(dataUrl\) \{\n\s*loadedUrls\.push\(dataUrl\);\n\s*\}\n\s*loadedCount\+\+;\n\s*if \(loadedCount === filesArray\.length\) \{\n\s*handleAddUrls\(loadedUrls\);\n\s*\}\n\s*\};\n\s*reader\.readAsDataURL\(file\);\n\s*\}\);/, newImageHandler);

fs.writeFileSync('src/components/GalleryBlock.tsx', code);
