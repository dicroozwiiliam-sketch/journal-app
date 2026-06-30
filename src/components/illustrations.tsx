/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Boy climbing ideas, plan, execution steps with a giant pencil and a windmill
export function BoyClimbingIllustration() {
  return (
    <div className="w-full max-w-[280px] aspect-square mx-auto relative flex items-center justify-center select-none">
      <svg viewBox="0 0 400 400" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft morning sun in background */}
        <circle cx="90" cy="100" r="45" fill="#FFEBA3" opacity="0.8" />
        <circle cx="90" cy="100" r="55" stroke="#FFEBA3" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />

        {/* Rolling Hills in background */}
        <path d="M-20 320 C100 280 200 340 420 310" stroke="#4A3D30" strokeWidth="3" fill="#EADCA6" />
        <path d="M-50 360 C150 310 250 350 450 330" stroke="#4A3D30" strokeWidth="3" fill="#E08E6D" opacity="0.2" />

        {/* A Cute Windmill on the right hill */}
        <g transform="translate(260, 180)">
          {/* Windmill body */}
          <path d="M20 100 L35 40 L45 40 L60 100 Z" fill="#FAF6EB" stroke="#4A3D30" strokeWidth="3" />
          <polygon points="35,40 40,25 45,40" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3" />
          {/* Windmill window and door */}
          <rect x="36" y="50" width="8" height="12" rx="4" fill="#E08E6D" stroke="#4A3D30" strokeWidth="2.5" />
          <rect x="37" y="80" width="6" height="20" rx="1" fill="#4A3D30" />
          
          {/* Windmill blades */}
          <g className="animate-spin" style={{ transformOrigin: '40px 40px', animationDuration: '12s' }}>
            <line x1="40" y1="40" x2="10" y2="10" stroke="#4A3D30" strokeWidth="3" />
            <polygon points="10,10 5,20 20,25" fill="#E6C585" stroke="#4A3D30" strokeWidth="2" />

            <line x1="40" y1="40" x2="70" y2="10" stroke="#4A3D30" strokeWidth="3" />
            <polygon points="70,10 80,15 65,30" fill="#E6C585" stroke="#4A3D30" strokeWidth="2" />

            <line x1="40" y1="40" x2="70" y2="70" stroke="#4A3D30" strokeWidth="3" />
            <polygon points="70,70 65,80 50,65" fill="#E6C585" stroke="#4A3D30" strokeWidth="2" />

            <line x1="40" y1="40" x2="10" y2="70" stroke="#4A3D30" strokeWidth="3" />
            <polygon points="10,70 15,60 30,75" fill="#E6C585" stroke="#4A3D30" strokeWidth="2" />
          </g>
          {/* Cap pivot */}
          <circle cx="40" cy="40" r="4" fill="#4A3D30" />
        </g>

        {/* Small background trees */}
        <g transform="translate(40, 240)">
          <line x1="10" y1="30" x2="10" y2="70" stroke="#4A3D30" strokeWidth="3.5" />
          <path d="M10 10 C-5 25 -5 45 10 50 C25 45 25 25 10 10 Z" fill="#96A376" stroke="#4A3D30" strokeWidth="3" />
        </g>
        <g transform="translate(15, 255)">
          <line x1="10" y1="20" x2="10" y2="55" stroke="#4A3D30" strokeWidth="3.5" />
          <path d="M10 5 C0 15 0 35 10 40 C20 35 20 15 10 5 Z" fill="#96A376" stroke="#4A3D30" strokeWidth="2.5" />
        </g>

        {/* Step 1: ideas (Green step at bottom) */}
        <g transform="translate(60, 290)">
          {/* Top block surface */}
          <polygon points="10,15 130,15 110,40 0,40" fill="#96A376" stroke="#4A3D30" strokeWidth="3.5" />
          {/* Side block */}
          <polygon points="0,40 110,40 110,75 0,75" fill="#7D8A5D" stroke="#4A3D30" strokeWidth="3.5" />
          <polygon points="110,40 130,15 130,50 110,75" fill="#68734E" stroke="#4A3D30" strokeWidth="3.5" />
          {/* Text: ideas */}
          <text x="35" y="63" fill="#4A3D30" fontSize="16" fontWeight="900" letterSpacing="0.5">ideas</text>
        </g>

        {/* Step 2: plan (Sand/Cream step in middle) */}
        <g transform="translate(105, 230)">
          {/* Top block surface */}
          <polygon points="10,15 130,15 110,40 0,40" fill="#F4EBD0" stroke="#4A3D30" strokeWidth="3.5" />
          {/* Side block */}
          <polygon points="0,40 110,40 110,75 0,75" fill="#E6D8B3" stroke="#4A3D30" strokeWidth="3.5" />
          <polygon points="110,40 130,15 130,50 110,75" fill="#CDBFA2" stroke="#4A3D30" strokeWidth="3.5" />
          {/* Text: plan */}
          <text x="40" y="63" fill="#4A3D30" fontSize="16" fontWeight="900" letterSpacing="0.5">plan</text>
        </g>

        {/* Step 3: execution (Orange step at top) */}
        <g transform="translate(150, 170)">
          {/* Top block surface */}
          <polygon points="10,15 130,15 110,40 0,40" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3.5" />
          {/* Side block */}
          <polygon points="0,40 110,40 110,75 0,75" fill="#CD7C58" stroke="#4A3D30" strokeWidth="3.5" />
          <polygon points="110,40 130,15 130,50 110,75" fill="#B46A48" stroke="#4A3D30" strokeWidth="3.5" />
          {/* Text: execution */}
          <text x="22" y="63" fill="#4A3D30" fontSize="15" fontWeight="900" letterSpacing="0.5">execution</text>
        </g>

        {/* Boy character holding a giant pencil, walking up steps */}
        <g transform="translate(60, 140)">
          {/* Giant Wooden Pencil he's carrying on his shoulder */}
          <g transform="rotate(-12, 100, 70)">
            {/* Pencil body */}
            <rect x="10" y="60" width="160" height="24" rx="2" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3.5" />
            <line x1="10" y1="68" x2="170" y2="68" stroke="#CD7C58" strokeWidth="2.5" />
            <line x1="10" y1="76" x2="170" y2="76" stroke="#CD7C58" strokeWidth="2.5" />
            
            {/* Wooden shaved tip */}
            <polygon points="170,60 170,84 200,72" fill="#F4EBD0" stroke="#4A3D30" strokeWidth="3.5" />
            
            {/* Pencil lead tip */}
            <polygon points="190,68 190,76 200,72" fill="#4A3D30" />
            
            {/* Eraser head at back */}
            <path d="M10 60 L10 84 C4 84 4 60 10 60" fill="#FAF6EB" stroke="#4A3D30" strokeWidth="3" />
          </g>

          {/* Boy's Left Leg (behind step) */}
          <path d="M110 115 L120 150 L140 150" stroke="#4A3D30" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          {/* Left shoe */}
          <path d="M135 144 L155 144 C160 144 160 156 145 156 L130 156 Z" fill="#FAF6EB" stroke="#4A3D30" strokeWidth="3" />

          {/* Boy's Body */}
          <path d="M100 65 L115 115" stroke="#4A3D30" strokeWidth="35" strokeLinecap="round" />
          {/* White T-shirt overlay */}
          <path d="M96 68 C100 62 110 62 115 68 L118 102 L95 102 Z" fill="#FAF6EB" stroke="#4A3D30" strokeWidth="3.5" />

          {/* Orange Shorts */}
          <path d="M96 102 L118 102 L115 118 L94 118 Z" fill="#E6C585" stroke="#4A3D30" strokeWidth="3.5" />

          {/* Right Leg (walking up higher step) */}
          <path d="M95 115 L80 145 L100 160" stroke="#4A3D30" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          {/* Right shoe */}
          <path d="M95 152 L115 157 C120 158 116 168 102 166 L90 160 Z" fill="#FAF6EB" stroke="#4A3D30" strokeWidth="3" />

          {/* Boy's head */}
          <circle cx="110" cy="45" r="18" fill="#FADCB4" stroke="#4A3D30" strokeWidth="3.5" />
          {/* Smile and Eye */}
          <circle cx="118" cy="42" r="2" fill="#4A3D30" />
          <path d="M116 49 Q122 51 120 46" stroke="#4A3D30" strokeWidth="2.5" fill="none" />
          <path d="M110 27 Q115 22 122 35" stroke="#4A3D30" strokeWidth="3" fill="none" /> {/* Hair wave */}

          {/* Cozy Orange Bandana / Hat */}
          <path d="M92 38 C92 24 108 22 120 30 C124 32 126 38 120 38 Z" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3" />
          {/* Bandana tie at back */}
          <path d="M91 36 Q82 32 85 42 Q90 40 92 38" fill="#E08E6D" stroke="#4A3D30" strokeWidth="2.5" />

          {/* Hands holding the pencil */}
          {/* Right arm */}
          <path d="M102 75 Q130 80 135 60" stroke="#4A3D30" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="135" cy="58" r="5" fill="#FADCB4" stroke="#4A3D30" strokeWidth="2" />

          {/* Left arm */}
          <path d="M96 70 Q75 60 70 82" stroke="#4A3D30" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="70" cy="84" r="5" fill="#FADCB4" stroke="#4A3D30" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

// Cute Orange Waving Striped Cat
export function WavingCatIllustration() {
  return (
    <div className="w-full max-w-[200px] aspect-[5/4] mx-auto relative select-none">
      <svg viewBox="0 0 250 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Decorative elements: Paw prints on left */}
        <g transform="translate(30, 60)" opacity="0.8">
          {/* main pad */}
          <ellipse cx="20" cy="20" rx="9" ry="7" fill="#8C7053" />
          {/* toes */}
          <circle cx="10" cy="11" r="3.5" fill="#8C7053" />
          <circle cx="20" cy="8" r="3.5" fill="#8C7053" />
          <circle cx="30" cy="11" r="3.5" fill="#8C7053" />
        </g>
        <g transform="translate(15, 110)" opacity="0.5" scale="0.7">
          <ellipse cx="20" cy="20" rx="9" ry="7" fill="#8C7053" />
          <circle cx="10" cy="11" r="3.5" fill="#8C7053" />
          <circle cx="20" cy="8" r="3.5" fill="#8C7053" />
          <circle cx="30" cy="11" r="3.5" fill="#8C7053" />
        </g>

        {/* Ground Curve */}
        <path d="M-10 185 C80 160 170 190 270 175" stroke="#4A3D30" strokeWidth="3" fill="#EADCA6" />

        {/* Small Grass tuffs */}
        <path d="M210 175 L215 160 M215 175 L222 162 M220 175 L227 167" stroke="#4A3D30" strokeWidth="2" />
        <path d="M25 185 L28 172 M28 185 L34 174" stroke="#4A3D30" strokeWidth="2" />

        {/* Cat Body */}
        <path d="M80 185 C80 120 180 120 180 185" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3.5" />
        
        {/* Cat Stripes on body */}
        <path d="M85 155 Q100 153 105 157" stroke="#CD7C58" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M175 155 Q160 153 155 157" stroke="#CD7C58" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M130 175 Q130 160 130 165" stroke="#CD7C58" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Cat Head */}
        <circle cx="130" cy="110" r="48" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3.5" />

        {/* Cat Ears */}
        {/* Left Ear */}
        <polygon points="90,80 95,40 120,70" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3.5" strokeLinejoin="round" />
        <polygon points="96,75 100,50 114,68" fill="#FADCB4" stroke="#4A3D30" strokeWidth="2" strokeLinejoin="round" />
        {/* Right Ear */}
        <polygon points="170,80 165,40 140,70" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3.5" strokeLinejoin="round" />
        <polygon points="164,75 160,50 146,68" fill="#FADCB4" stroke="#4A3D30" strokeWidth="2" strokeLinejoin="round" />

        {/* Head Stripes */}
        <path d="M130 62 L130 74" stroke="#CD7C58" strokeWidth="4" strokeLinecap="round" />
        <path d="M120 64 Q123 74 122 75" stroke="#CD7C58" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M140 64 Q137 74 138 75" stroke="#CD7C58" strokeWidth="3.5" strokeLinecap="round" />

        {/* Face details */}
        {/* Eyes */}
        <circle cx="112" cy="105" r="4.5" fill="#4A3D30" />
        <circle cx="148" cy="105" r="4.5" fill="#4A3D30" />
        {/* White highlights */}
        <circle cx="110.5" cy="103.5" r="1.5" fill="#FFF" />
        <circle cx="146.5" cy="103.5" r="1.5" fill="#FFF" />

        {/* Rosy cheeks */}
        <ellipse cx="102" cy="116" rx="6" ry="3.5" fill="#CD7C58" opacity="0.6" />
        <ellipse cx="158" cy="116" rx="6" ry="3.5" fill="#CD7C58" opacity="0.6" />

        {/* Nose and Mouth */}
        <polygon points="130,111 127,108 133,108" fill="#4A3D30" />
        <path d="M130 111 Q125 118 120 114" stroke="#4A3D30" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M130 111 Q135 118 140 114" stroke="#4A3D30" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Whiskers */}
        <line x1="86" y1="112" x2="68" y2="108" stroke="#4A3D30" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="86" y1="120" x2="66" y2="120" stroke="#4A3D30" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="174" y1="112" x2="192" y2="108" stroke="#4A3D30" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="174" y1="120" x2="194" y2="120" stroke="#4A3D30" strokeWidth="2.5" strokeLinecap="round" />

        {/* Waving Arm (waving motion with rotate animation) */}
        <g className="animate-bounce" style={{ transformOrigin: '82px 145px', animationDuration: '3s' }}>
          {/* Paw */}
          <path d="M64 125 C54 110 74 100 84 115 L100 135 L80 148 Z" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3" strokeLinejoin="round" />
          {/* Pink padding */}
          <circle cx="71" cy="117" r="4.5" fill="#FADCB4" stroke="#4A3D30" strokeWidth="1.5" />
          <circle cx="63" cy="122" r="2.5" fill="#FADCB4" />
          <circle cx="70" cy="111" r="2.5" fill="#FADCB4" />
          <circle cx="78" cy="115" r="2.5" fill="#FADCB4" />
        </g>

        {/* Left static foot */}
        <path d="M96 175 C96 165 116 165 116 175 L116 186 L96 186 Z" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3" />
        <line x1="103" y1="180" x2="103" y2="186" stroke="#4A3D30" strokeWidth="2.5" />
        <line x1="109" y1="180" x2="109" y2="186" stroke="#4A3D30" strokeWidth="2.5" />

        {/* Right static foot */}
        <path d="M144 175 C144 165 164 165 164 175 L164 186 L144 186 Z" fill="#E08E6D" stroke="#4A3D30" strokeWidth="3" />
        <line x1="151" y1="180" x2="151" y2="186" stroke="#4A3D30" strokeWidth="2.5" />
        <line x1="157" y1="180" x2="157" y2="186" stroke="#4A3D30" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

// Cute notepad notebook calendar illustration with a pencil drawing
export function NotebookCalendarIllustration() {
  return (
    <div className="w-full max-w-[190px] aspect-[4/3] mx-auto select-none">
      <svg viewBox="0 0 200 150" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft grass meadow underneath */}
        <path d="M10 135 C70 125 130 135 190 130" stroke="#4A3D30" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M150 131 L152 120 M153 131 L158 123" stroke="#4A3D30" strokeWidth="2" />
        <path d="M40 134 L42 124 M42 134 L47 126" stroke="#4A3D30" strokeWidth="2" />

        {/* Cozy Shadows */}
        <rect x="35" y="45" width="125" height="85" rx="10" fill="#4A3D30" opacity="0.1" />

        {/* Main Notepad Body (Warm Cardboard background style) */}
        <rect x="30" y="40" width="125" height="85" rx="10" fill="#E6C585" stroke="#4A3D30" strokeWidth="3.5" />

        {/* White paper page overlay */}
        <rect x="38" y="52" width="109" height="66" rx="6" fill="#FAF6EB" stroke="#4A3D30" strokeWidth="3" />

        {/* Top Wire Ring Binders */}
        <g transform="translate(42, 30)">
          {/* Ring 1 */}
          <path d="M5 5 C5 -5 15 -5 15 5" stroke="#4A3D30" strokeWidth="3" fill="none" />
          <circle cx="10" cy="10" r="2.5" fill="#4A3D30" />
          {/* Ring 2 */}
          <path d="M25 5 C25 -5 35 -5 35 5" stroke="#4A3D30" strokeWidth="3" fill="none" />
          <circle cx="30" cy="10" r="2.5" fill="#4A3D30" />
          {/* Ring 3 */}
          <path d="M45 5 C45 -5 55 -5 55 5" stroke="#4A3D30" strokeWidth="3" fill="none" />
          <circle cx="50" cy="10" r="2.5" fill="#4A3D30" />
          {/* Ring 4 */}
          <path d="M65 5 C65 -5 75 -5 75 5" stroke="#4A3D30" strokeWidth="3" fill="none" />
          <circle cx="70" cy="10" r="2.5" fill="#4A3D30" />
          {/* Ring 5 */}
          <path d="M85 5 C85 -5 95 -5 95 5" stroke="#4A3D30" strokeWidth="3" fill="none" />
          <circle cx="90" cy="10" r="2.5" fill="#4A3D30" />
        </g>

        {/* Checkmark circle inside the page */}
        <circle cx="92" cy="85" r="22" fill="#FAF6EB" stroke="#96A376" strokeWidth="3.5" />
        <path d="M84 85 L90 91 L103 76" stroke="#96A376" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Cute Pencil lying next to the notebook */}
        <g transform="translate(132, 75) rotate(40)">
          {/* Pencil body */}
          <rect x="0" y="0" width="36" height="12" rx="1" fill="#E08E6D" stroke="#4A3D30" strokeWidth="2.5" />
          {/* Shaved wood tip */}
          <polygon points="36,0 36,12 45,6" fill="#FADCB4" stroke="#4A3D30" strokeWidth="2.5" />
          {/* Lead */}
          <polygon points="41,3 41,9 45,6" fill="#4A3D30" />
          {/* Eraser */}
          <rect x="-6" y="0" width="6" height="12" rx="1" fill="#FAF6EB" stroke="#4A3D30" strokeWidth="2.5" />
        </g>
      </svg>
    </div>
  );
}
