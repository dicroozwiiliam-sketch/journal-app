const fs = require('fs');
let code = fs.readFileSync('src/components/ProfilePage.tsx', 'utf8');

const resizeLogic = `
                              const file = e.target.files?.[0];
                              if (file) {
                                const compressImage = (imageFile) => {
                                  const img = new Image();
                                  img.src = URL.createObjectURL(imageFile);
                                  img.onload = () => {
                                    const canvas = document.createElement("canvas");
                                    const MAX_WIDTH = 256;
                                    const MAX_HEIGHT = 256;
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
                                    setSelectedImageUrl(compressedDataUrl);
                                    triggerToast("Cozy custom photo optimized and uploaded successfully! 📸", "success");
                                  };
                                };
                                compressImage(file);
                              }
`;

// Replace the onChange handler logic
code = code.replace(/const file = e\.target\.files\?\.\[0\];\s*if \(file\) \{[\s\S]*?reader\.readAsDataURL\(file\);\s*\}/, resizeLogic.trim());

fs.writeFileSync('src/components/ProfilePage.tsx', code);
