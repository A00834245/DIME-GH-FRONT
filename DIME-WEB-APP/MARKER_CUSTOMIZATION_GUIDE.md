# 🎨 Google Maps Marker Customization Guide

**Complete step-by-step guide to customize markers with code and SVG**

---

## 📋 Table of Contents

1. [Understanding the Current Implementation](#understanding-the-current-implementation)
2. [Basic Color Changes](#basic-color-changes)
3. [Size Modifications](#size-modifications)
4. [Shape Customization](#shape-customization)
5. [Adding Icons and Text](#adding-icons-and-text)
6. [Advanced SVG Styling](#advanced-svg-styling)
7. [Using Image Files](#using-image-files)
8. [Interactive Effects](#interactive-effects)
9. [Performance Tips](#performance-tips)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Understanding the Current Implementation

### Current Files Structure
```
src/app/
├── map.ts                    # Main map component (marker creation)
├── services/
│   └── dataset.service.ts    # Data fetching service
└── map.css                   # Styling (if needed)
```

### Current Marker Creation Process
1. **Data fetch** → Backend provides GeoJSON with marker properties
2. **Category detection** → Extract category from `properties.Category`
3. **Color assignment** → `getMarkerColor()` returns color based on category
4. **SVG generation** → Dynamic SVG string creation
5. **Marker creation** → Google Maps marker with SVG as data URL

---

## 🎨 Basic Color Changes

### Step 1: Modify Marker Colors

**File**: `src/app/map.ts` (around line 382)

**Current code:**
```typescript
private getMarkerColor(category: string): string {
  switch (category) {
    case 'Estacionamiento':
      return '#2196F3'; // Blue for parking
    case 'Cliente':
      return '#F44336'; // Red for clients
    case 'CEDI':
      return '#FF9800'; // Orange for CEDI
    default:
      return '#9C27B0'; // Purple for unknown
  }
}
```

**How to change colors:**
```typescript
private getMarkerColor(category: string): string {
  switch (category) {
    case 'Estacionamiento':
      return '#00BCD4'; // Cyan
    case 'Cliente':
      return '#8BC34A'; // Light Green
    case 'CEDI':
      return '#E91E63'; // Pink
    case 'Hospital':      // Add new categories
      return '#FFC107'; // Amber
    default:
      return '#607D8B'; // Blue Grey
  }
}
```

**Color Resources:**
- [Material Design Colors](https://material.io/design/color/)
- [HTML Color Codes](https://htmlcolorcodes.com/)
- Use format: `#RRGGBB` (hex) or `rgb(r, g, b)` or CSS color names

---

## 📏 Size Modifications

### Step 2: Add Dynamic Sizing

**Current SVG creation** (around line 258):
```typescript
const svgIcon = `
  <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" 
            fill="${color}" 
            stroke="white" 
            stroke-width="2"/>
  </svg>
`;
```

**Enhanced with dynamic sizing:**

**Step 2a: Add size function**
```typescript
private getMarkerSize(category: string): number {
  switch (category) {
    case 'CEDI':
      return 32; // Largest for most important
    case 'Cliente':
      return 24; // Medium for clients
    case 'Estacionamiento':
      return 20; // Standard for parking
    default:
      return 16; // Smallest for unknown
  }
}
```

**Step 2b: Update SVG generation**
```typescript
private createColoredMarkerFromFeature(feature: any): void {
  try {
    const [lng, lat] = feature.geometry.coordinates;
    const properties = feature.properties || {};
    
    const category = properties.Category || properties.category || 'Estacionamiento';
    const color = this.getMarkerColor(category);
    const size = this.getMarkerSize(category);           // Add this
    
    const svgIcon = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 3}" 
                fill="${color}" 
                stroke="white" 
                stroke-width="2"/>
      </svg>
    `;
    
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: properties.Name || properties.name || category,
      icon: {
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIcon)}`,
        scaledSize: new google.maps.Size(size, size),    // Update this
        anchor: new google.maps.Point(size/2, size/2)    // Update this
      }
    });
    
    // ... rest of the marker creation code
  }
}
```

---

## 🔷 Shape Customization

### Step 3: Different Shapes for Different Categories

**Add shape function:**
```typescript
private getMarkerShape(category: string): 'circle' | 'square' | 'diamond' | 'pin' | 'star' {
  switch (category) {
    case 'CEDI':
      return 'diamond';      // Diamond for distribution centers
    case 'Cliente':
      return 'square';       // Square for clients
    case 'Estacionamiento':
      return 'circle';       // Circle for parking
    case 'Hospital':
      return 'pin';          // Pin for hospitals
    case 'Emergency':
      return 'star';         // Star for emergency
    default:
      return 'circle';
  }
}
```

**Update SVG generation with shapes:**
```typescript
private generateMarkerSVG(category: string, color: string, size: number): string {
  const shape = this.getMarkerShape(category);
  const center = size / 2;
  const radius = center - 3;
  
  let shapeElement = '';
  
  switch (shape) {
    case 'circle':
      shapeElement = `<circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="white" stroke-width="2"/>`;
      break;
      
    case 'square':
      const squareSize = radius * 1.4;
      const squarePos = center - squareSize/2;
      shapeElement = `<rect x="${squarePos}" y="${squarePos}" width="${squareSize}" height="${squareSize}" fill="${color}" stroke="white" stroke-width="2"/>`;
      break;
      
    case 'diamond':
      const points = `${center},3 ${size-3},${center} ${center},${size-3} 3,${center}`;
      shapeElement = `<polygon points="${points}" fill="${color}" stroke="white" stroke-width="2"/>`;
      break;
      
    case 'pin':
      const path = `M${center} 3 C${center-6} 3 3 ${center-6} 3 ${center} C3 ${center+6} ${center} ${size-3} ${center} ${size-3} S${size-3} ${center+6} ${size-3} ${center} C${size-3} ${center-6} ${center+6} 3 ${center} 3z`;
      shapeElement = `<path d="${path}" fill="${color}" stroke="white" stroke-width="2"/>`;
      break;
      
    case 'star':
      const starPoints = this.generateStarPoints(center, radius-2);
      shapeElement = `<polygon points="${starPoints}" fill="${color}" stroke="white" stroke-width="2"/>`;
      break;
      
    default:
      shapeElement = `<circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="white" stroke-width="2"/>`;
  }
  
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      ${shapeElement}
    </svg>
  `;
}

private generateStarPoints(center: number, radius: number): string {
  const points = [];
  const spikes = 5;
  const outerRadius = radius;
  const innerRadius = radius * 0.4;
  
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = center + r * Math.cos(angle - Math.PI / 2);
    const y = center + r * Math.sin(angle - Math.PI / 2);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  
  return points.join(' ');
}
```

**Update marker creation to use new SVG function:**
```typescript
// Replace the SVG creation part with:
const svgIcon = this.generateMarkerSVG(category, color, size);
```

---

## 📝 Adding Icons and Text

### Step 4: Add Icons and Text to Markers

**Add icon/text function:**
```typescript
private getMarkerContent(category: string): { type: 'emoji' | 'text' | 'icon', content: string } {
  switch (category) {
    case 'CEDI':
      return { type: 'emoji', content: '🏭' };
    case 'Cliente':
      return { type: 'text', content: 'C' };
    case 'Estacionamiento':
      return { type: 'emoji', content: '🅿️' };
    case 'Hospital':
      return { type: 'emoji', content: '🏥' };
    case 'Restaurant':
      return { type: 'emoji', content: '🍽️' };
    case 'Gas':
      return { type: 'emoji', content: '⛽' };
    default:
      return { type: 'text', content: '?' };
  }
}
```

**Enhanced SVG with content:**
```typescript
private generateMarkerSVG(category: string, color: string, size: number): string {
  const shape = this.getMarkerShape(category);
  const content = this.getMarkerContent(category);
  const center = size / 2;
  const radius = center - 3;
  
  // Shape generation (same as above)
  let shapeElement = this.generateShapeElement(shape, center, radius, color);
  
  // Content generation
  let contentElement = '';
  if (content.type === 'emoji') {
    contentElement = `
      <text x="${center}" y="${center + 4}" 
            text-anchor="middle" 
            fill="white" 
            font-family="Arial" 
            font-size="${size * 0.5}" 
            font-weight="bold">${content.content}</text>
    `;
  } else if (content.type === 'text') {
    contentElement = `
      <text x="${center}" y="${center + 4}" 
            text-anchor="middle" 
            fill="white" 
            font-family="Arial, sans-serif" 
            font-size="${size * 0.6}" 
            font-weight="bold">${content.content}</text>
    `;
  }
  
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      ${shapeElement}
      ${contentElement}
    </svg>
  `;
}
```

---

## ✨ Advanced SVG Styling

### Step 5: Add Gradients and Effects

**Enhanced SVG with gradients:**
```typescript
private generateAdvancedMarkerSVG(category: string, color: string, size: number): string {
  const secondaryColor = this.getDarkerColor(color);
  const center = size / 2;
  const radius = center - 3;
  const gradientId = `grad-${category.replace(/\s+/g, '-').toLowerCase()}`;
  
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Gradient Definition -->
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
        </linearGradient>
        
        <!-- Shadow Filter -->
        <filter id="shadow-${category}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
        
        <!-- Glow Filter -->
        <filter id="glow-${category}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Main Shape with Gradient -->
      <circle cx="${center}" cy="${center}" r="${radius}" 
              fill="url(#${gradientId})" 
              stroke="white" 
              stroke-width="2"
              filter="url(#shadow-${category})"/>
      
      <!-- Highlight Ring -->
      <circle cx="${center}" cy="${center}" r="${radius - 2}" 
              fill="none" 
              stroke="rgba(255,255,255,0.4)" 
              stroke-width="1"/>
      
      <!-- Content -->
      <text x="${center}" y="${center + 4}" 
            text-anchor="middle" 
            fill="white" 
            font-family="Arial" 
            font-size="${size * 0.5}" 
            font-weight="bold"
            filter="url(#glow-${category})">${this.getMarkerContent(category).content}</text>
    </svg>
  `;
}

private getDarkerColor(color: string): string {
  // Convert hex to RGB, darken by 20%, convert back
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0,2), 16) - 50);
  const g = Math.max(0, parseInt(hex.substr(2,2), 16) - 50);
  const b = Math.max(0, parseInt(hex.substr(4,2), 16) - 50);
  
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
```

---

## 🖼️ Using Image Files

### Step 6: Use Custom PNG/SVG Images

**Step 6a: Add images to assets**
```
src/assets/markers/
├── cedi-marker.png        (32x32 pixels)
├── cliente-marker.png     (24x24 pixels)
├── parking-marker.svg     (20x20 pixels)
└── hospital-marker.png    (28x28 pixels)
```

**Step 6b: Update marker creation to use images**
```typescript
private getMarkerImagePath(category: string): { path: string, size: number } {
  switch (category) {
    case 'CEDI':
      return { path: 'assets/markers/cedi-marker.png', size: 32 };
    case 'Cliente':
      return { path: 'assets/markers/cliente-marker.png', size: 24 };
    case 'Estacionamiento':
      return { path: 'assets/markers/parking-marker.svg', size: 20 };
    case 'Hospital':
      return { path: 'assets/markers/hospital-marker.png', size: 28 };
    default:
      return { path: 'assets/markers/default-marker.png', size: 20 };
  }
}

private createImageMarkerFromFeature(feature: any): void {
  try {
    const [lng, lat] = feature.geometry.coordinates;
    const properties = feature.properties || {};
    const category = properties.Category || properties.category || 'Estacionamiento';
    
    const markerImage = this.getMarkerImagePath(category);
    
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: properties.Name || properties.name || category,
      icon: {
        url: markerImage.path,
        scaledSize: new google.maps.Size(markerImage.size, markerImage.size),
        anchor: new google.maps.Point(markerImage.size/2, markerImage.size/2)
      }
    });
    
    // Add click listener
    marker.addListener('click', () => {
      this.showMarkerInfoWindow(properties, { lat, lng });
    });
    
    this.markers.push(marker);
  } catch (error) {
    console.error('Error creating image marker:', error);
  }
}
```

**Step 6c: Switch between SVG and Image markers**
```typescript
private useImageMarkers = false; // Set to true to use image files

private createColoredMarkerFromFeature(feature: any): void {
  if (this.useImageMarkers) {
    this.createImageMarkerFromFeature(feature);
  } else {
    this.createSVGMarkerFromFeature(feature);
  }
}
```

---

## 🎭 Interactive Effects

### Step 7: Add Hover and Animation Effects

**Add hover effects:**
```typescript
private createInteractiveMarkerFromFeature(feature: any): void {
  try {
    const [lng, lat] = feature.geometry.coordinates;
    const properties = feature.properties || {};
    const category = properties.Category || properties.category || 'Estacionamiento';
    
    const color = this.getMarkerColor(category);
    const size = this.getMarkerSize(category);
    const normalSvg = this.generateMarkerSVG(category, color, size);
    const hoverSvg = this.generateMarkerSVG(category, color, size * 1.2); // 20% larger
    
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: properties.Name || properties.name || category,
      icon: {
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalSvg)}`,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size/2, size/2)
      }
    });
    
    // Hover effects
    marker.addListener('mouseover', () => {
      marker.setIcon({
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(hoverSvg)}`,
        scaledSize: new google.maps.Size(size * 1.2, size * 1.2),
        anchor: new google.maps.Point(size * 0.6, size * 0.6)
      });
    });
    
    marker.addListener('mouseout', () => {
      marker.setIcon({
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalSvg)}`,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size/2, size/2)
      });
    });
    
    // Click for info window
    marker.addListener('click', () => {
      this.showMarkerInfoWindow(properties, { lat, lng });
    });
    
    this.markers.push(marker);
  } catch (error) {
    console.error('Error creating interactive marker:', error);
  }
}
```

**Add bounce animation on click:**
```typescript
marker.addListener('click', () => {
  // Start bounce animation
  marker.setAnimation(google.maps.Animation.BOUNCE);
  
  // Stop after 2 seconds
  setTimeout(() => {
    marker.setAnimation(null);
  }, 2000);
  
  // Show info window
  this.showMarkerInfoWindow(properties, { lat, lng });
});
```

---

## ⚡ Performance Tips

### Step 8: Optimize for Many Markers

**Marker Clustering (for 100+ markers):**
```bash
# Install clustering library
npm install @googlemaps/markerclusterer
```

```typescript
import { MarkerClusterer } from '@googlemaps/markerclusterer';

// After creating all markers
private setupMarkerClustering(): void {
  if (this.markers.length > 50) {
    const markerCluster = new MarkerClusterer({ 
      map: this.map, 
      markers: this.markers,
      gridSize: 60,
      maxZoom: 15
    });
  }
}
```

**Viewport-based Loading:**
```typescript
private loadMarkersInViewport(): void {
  const bounds = this.map.getBounds();
  const visibleFeatures = this.allFeatures.filter(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    return bounds.contains(new google.maps.LatLng(lat, lng));
  });
  
  // Only create markers for visible features
  visibleFeatures.forEach(feature => {
    this.createColoredMarkerFromFeature(feature);
  });
}
```

**SVG Caching:**
```typescript
private svgCache = new Map<string, string>();

private getCachedSVG(category: string, color: string, size: number): string {
  const key = `${category}-${color}-${size}`;
  if (!this.svgCache.has(key)) {
    this.svgCache.set(key, this.generateMarkerSVG(category, color, size));
  }
  return this.svgCache.get(key)!;
}
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

**1. Markers not appearing:**
```typescript
// Debug marker creation
console.log('Creating marker at:', lat, lng);
console.log('SVG content:', svgIcon);
console.log('Marker icon config:', marker.getIcon());
```

**2. SVG rendering issues:**
```typescript
// Validate SVG
const isValidSVG = svgIcon.includes('<svg') && svgIcon.includes('</svg>');
if (!isValidSVG) {
  console.error('Invalid SVG generated:', svgIcon);
  return; // Skip this marker
}
```

**3. Performance issues:**
```typescript
// Limit markers during development
if (this.markers.length > 100) {
  console.warn('Too many markers, consider clustering');
}
```

**4. Image loading issues:**
```typescript
// Preload images
private preloadMarkerImages(): Promise<void> {
  const imagePaths = [
    'assets/markers/cedi-marker.png',
    'assets/markers/cliente-marker.png'
  ];
  
  return Promise.all(imagePaths.map(path => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(path);
      img.onerror = () => reject(`Failed to load: ${path}`);
      img.src = path;
    });
  })).then(() => {
    console.log('All marker images preloaded');
  });
}
```

---

## 🔄 Quick Reference Checklist

### To Change Marker Colors:
- [ ] Edit `getMarkerColor()` method in `map.ts`
- [ ] Use hex colors (`#FF0000`) or CSS colors (`red`)

### To Change Marker Sizes:
- [ ] Add `getMarkerSize()` method
- [ ] Update SVG width/height and scaledSize
- [ ] Update anchor point calculation

### To Change Marker Shapes:
- [ ] Add `getMarkerShape()` method
- [ ] Update SVG generation with shape logic
- [ ] Test all shape combinations

### To Add Icons/Text:
- [ ] Add content to SVG `<text>` element
- [ ] Adjust font-size relative to marker size
- [ ] Consider using emojis or Unicode symbols

### To Use Images:
- [ ] Add image files to `src/assets/markers/`
- [ ] Update marker icon config to use file paths
- [ ] Remove SVG generation code

### To Add Animations:
- [ ] Use `google.maps.Animation.BOUNCE` or `DROP`
- [ ] Add hover listeners for interactive effects
- [ ] Set animation timeout to avoid infinite bouncing

---

## 📞 Support

**If you encounter issues:**

1. **Check browser console** for error messages
2. **Validate SVG** using online SVG validators
3. **Test with simple colors** before adding complex features
4. **Use browser dev tools** to inspect generated SVG
5. **Reduce marker count** for testing complex features

**Useful debugging commands:**
```typescript
// Log marker creation
console.log('Markers created:', this.markers.length);

// Inspect marker properties
this.markers.forEach((marker, index) => {
  console.log(`Marker ${index}:`, marker.getPosition(), marker.getIcon());
});

// Test SVG validity
const testSvg = this.generateMarkerSVG('CEDI', '#FF9800', 32);
console.log('Generated SVG:', testSvg);
```

---

**Happy marker customizing! 🎯**