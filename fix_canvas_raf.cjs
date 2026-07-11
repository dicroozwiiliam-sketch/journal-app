const fs = require('fs');
let code = fs.readFileSync('src/components/FloatingCanvas.tsx', 'utf8');

const rafLogic = `
  // Global mouse move and mouse up handlers for drag / resize / rotate interactions
  useEffect(() => {
    let rafId: number | null = null;
    let isDragging = false;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!interaction.type || !interaction.objId || !canvasRef.current) return;
      
      const targetObj = selectedObjectRef.current;
      if (!targetObj || targetObj.isLocked) return;

      if (!isDragging) {
        isDragging = true;
        rafId = requestAnimationFrame(() => {
          const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
          const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
          const rect = canvasRef.current!.getBoundingClientRect();

          if (interaction.type === 'move') {
            const deltaX = clientX - interaction.startX;
            const deltaY = clientY - interaction.startY;
            
            // Convert pixel delta to percentage
            const deltaXPercent = (deltaX / rect.width) * 100;
            const deltaYPercent = (deltaY / rect.height) * 100;

            const updated = floatingObjects.map(o => {
              if (interaction.startGroupPositions && o.id in interaction.startGroupPositions) {
                const startPos = interaction.startGroupPositions[o.id];
                let newX = startPos.x + deltaXPercent;
                let newY = startPos.y + deltaYPercent;

                // Soft boundaries (-20% to 110%) to allow beautiful bleeding off the edges
                newX = Math.max(-20, Math.min(110, newX));
                newY = Math.max(-5, Math.min(110, newY));

                return {
                  ...o,
                  x: parseFloat(newX.toFixed(2)),
                  y: parseFloat(newY.toFixed(2))
                };
              } else if (o.id === interaction.objId) {
                let newX = interaction.startLeft + deltaXPercent;
                let newY = interaction.startTop + deltaYPercent;

                newX = Math.max(-20, Math.min(110, newX));
                newY = Math.max(-5, Math.min(110, newY));

                return { ...o, x: parseFloat(newX.toFixed(2)), y: parseFloat(newY.toFixed(2)) };
              }
              return o;
            });
            onChange(updated); // Live preview without creating history states instantly
          } 
          else if (interaction.type === 'resize') {
            const deltaX = clientX - interaction.startX;
            const deltaY = clientY - interaction.startY;

            const newWidth = Math.max(50, interaction.startWidth + deltaX);
            const newHeight = Math.max(40, interaction.startHeight + deltaY);

            const updated = floatingObjects.map(o => {
              if (o.id === interaction.objId) {
                return { ...o, width: Math.round(newWidth), height: Math.round(newHeight) };
              }
              return o;
            });
            onChange(updated);
          } 
          else if (interaction.type === 'rotate') {
            // Calculate angle between element center and cursor
            const angleRad = Math.atan2(clientY - interaction.centerY, clientX - interaction.centerX);
            let angleDeg = angleRad * (180 / Math.PI) + 90; // Add 90 offset to align top handle
            
            // Apply snap to grid every 15 degrees if shift key is pressed (done locally or universally)
            // Just basic rotation for now
            
            const updated = floatingObjects.map(o => {
              if (o.id === interaction.objId) {
                return { ...o, rotation: Math.round(angleDeg) };
              }
              return o;
            });
            onChange(updated);
          }
          
          isDragging = false;
        });
      }
    };
`;

code = code.replace(/\/\/ Global mouse move and mouse up handlers for drag \/ resize \/ rotate interactions\n\s*useEffect\(\(\) => \{\n\s*const handleGlobalMove = \(e: MouseEvent \| TouchEvent\) => \{[\s\S]*?onChange\(updated\);\n\s*\}\n\s*\}\n\s*\};\n/m, rafLogic);

// Wait, we also need to cancel RAF on mouse end.
const endLogic = `
    const handleGlobalEnd = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        isDragging = false;
      }
      if (interaction.type) {
`;

code = code.replace(/const handleGlobalEnd = \(\) => \{\n\s*if \(interaction\.type\) \{/m, endLogic);

fs.writeFileSync('src/components/FloatingCanvas.tsx', code);
