// // // backend/models/Banner.js
// // import mongoose from 'mongoose';

// // const BannerSchema = new mongoose.Schema(
// //   {
// //     // ==========================================
// //     // BASIC INFO
// //     // ==========================================
// //     title: { type: String, required: true },
// //     bannerType: {
// //       type: String,
// //       enum: ['Hero Large', 'Hero Small', 'Sidebar', 'Popup'],
// //       default: 'Hero Large',
// //     },
// //     image: { type: String, required: true },
// //     altText: { type: String },
// //     order: { type: Number, default: 1 },
// //     isActive: { type: Boolean, default: true },

// //     // ==========================================
// //     // LINK TARGET (Where button redirects)
// //     // ==========================================
// //     linkType: {
// //       type: String,
// //       enum: ['Category', 'Product', 'Custom URL', 'None'],
// //       default: 'None',
// //     },
// //     categoryId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'Category',
// //     },
// //     productId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'Product',
// //     },
// //     customUrl: { type: String },

// //     // ==========================================
// //     // ✅ BUTTON CUSTOMIZATION
// //     // ==========================================
// //     button: {
// //       // Text
// //       text: { type: String, default: 'Shop Now' },

// //       // Position on banner
// //       position: {
// //         type: String,
// //         enum: [
// //           'Bottom Left',
// //           'Bottom Center',
// //           'Bottom Right',
// //           'Center',
// //           'Center Left',
// //           'Center Right',
// //           'Top Left',
// //           'Top Right',
// //         ],
// //         default: 'Center',
// //       },

// //       // Size
// //       size: {
// //         type: String,
// //         enum: ['Small', 'Medium', 'Large'],
// //         default: 'Medium',
// //       },

// //       // Style variant
// //       style: {
// //         type: String,
// //         enum: ['Solid', 'Outline', 'Ghost'],
// //         default: 'Solid',
// //       },

// //       // Colors
// //       bgColor: { type: String, default: '#0f5a2e' },
// //       textColor: { type: String, default: '#ffffff' },
// //       hoverBgColor: { type: String, default: '#0a4221' },

// //       // Shape
// //       borderRadius: {
// //         type: String,
// //         enum: ['none', 'sm', 'md', 'lg', 'full'],
// //         default: 'md',
// //       },

// //       // Icon
// //       showArrow: { type: Boolean, default: true },
// //     },

// //     // ==========================================
// //     // OVERLAY (Dark layer over image for readability)
// //     // ==========================================
// //     overlayType: {
// //       type: String,
// //       enum: ['Light', 'Dark', 'None'],
// //       default: 'Dark',
// //     },
// //     overlayOpacity: {
// //       type: Number,
// //       min: 0,
// //       max: 100,
// //       default: 30,
// //     },

// //     // ==========================================
// //     // DISPLAY SETTINGS
// //     // ==========================================
// //     showOnDesktop: { type: Boolean, default: true },
// //     showOnTablet: { type: Boolean, default: true },
// //     showOnMobile: { type: Boolean, default: true },

// //     startDate: { type: Date },
// //     endDate: { type: Date },

// //     showOnPages: {
// //       home: { type: Boolean, default: true },
// //       shop: { type: Boolean, default: false },
// //       category: { type: Boolean, default: false },
// //       product: { type: Boolean, default: false },
// //     },

// //     // ==========================================
// //     // ANIMATION & LAYOUT
// //     // ==========================================
// //     marginTop: { type: Number, default: 0 },
// //     marginBottom: { type: Number, default: 0 },
// //     animation: {
// //       type: String,
// //       enum: ['Fade In', 'Slide Up', 'None'],
// //       default: 'Fade In',
// //     },
// //     animationDuration: { type: Number, default: 800 },
// //   },
// //   { timestamps: true }
// // );

// // export default mongoose.model('Banner', BannerSchema);




















// //  new verion 17/9/2026
// // backend/models/Banner.js
// import mongoose from 'mongoose';

// const BannerSchema = new mongoose.Schema(
//   {
//     // ==========================================
//     // BASIC INFO
//     // ==========================================
//     title: { type: String, required: true, trim: true },
//     bannerType: {
//       type: String,
//       enum: ['Hero Large', 'Hero Small', 'Sidebar', 'Popup'],
//       default: 'Hero Large',
//     },
//     image: { type: String, required: true },
//     altText: { type: String, default: '' },
//     order: { type: Number, default: 1 },
//     isActive: { type: Boolean, default: true },

//     // ==========================================
//     // LINK TARGET
//     // ==========================================
//     linkType: {
//       type: String,
//       enum: ['Category', 'Product', 'Custom URL', 'None'],
//       default: 'None',
//     },
//     categoryId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Category',
//       default: null,
//     },
//     productId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product',
//       default: null,
//     },
//     customUrl: { type: String, default: '' },

//     // ==========================================
//     // BUTTON CUSTOMIZATION
//     // ==========================================
//     button: {
//       text: { type: String, default: 'Shop Now', trim: true },
//       position: {
//         type: String,
//         enum: [
//           'Bottom Left',
//           'Bottom Center',
//           'Bottom Right',
//           'Center',
//           'Center Left',
//           'Center Right',
//           'Top Left',
//           'Top Right',
//         ],
//         default: 'Center',
//       },
//       size: {
//         type: String,
//         enum: ['Small', 'Medium', 'Large', 'Custom'],
//         default: 'Medium',
//       },
//       style: {
//         type: String,
//         enum: ['Solid', 'Outline', 'Ghost'],
//         default: 'Solid',
//       },
//       bgColor: {
//         type: String,
//         default: '#0f5a2e',
//         match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
//       },
//       textColor: {
//         type: String,
//         default: '#ffffff',
//         match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
//       },
//       hoverBgColor: {
//         type: String,
//         default: '#0a4221',
//         match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
//       },
//       borderRadius: {
//         type: String,
//         enum: ['none', 'sm', 'md', 'lg', 'full'],
//         default: 'md',
//       },
//       showArrow: { type: Boolean, default: true },
//     },

//     // ==========================================
//     // OVERLAY
//     // ==========================================
//     overlayType: {
//       type: String,
//       enum: ['Light', 'Dark', 'None'],
//       default: 'Dark',
//     },
//     overlayOpacity: {
//       type: Number,
//       min: 0,
//       max: 100,
//       default: 30,
//     },

//     // ==========================================
//     // DISPLAY SETTINGS
//     // ==========================================
//     showOnDesktop: { type: Boolean, default: true },
//     showOnTablet: { type: Boolean, default: true },
//     showOnMobile: { type: Boolean, default: true },

//     startDate: { type: Date, default: null },
//     endDate: { type: Date, default: null },

//     showOnPages: {
//       home: { type: Boolean, default: true },
//       shop: { type: Boolean, default: false },
//       category: { type: Boolean, default: false },
//       product: { type: Boolean, default: false },
//     },

//     // ==========================================
//     // ANIMATION & LAYOUT
//     // ==========================================
//     marginTop: { type: Number, default: 0 },
//     marginBottom: { type: Number, default: 0 },
//     animation: {
//       type: String,
//       enum: ['Fade In', 'Slide Up', 'None'],
//       default: 'Fade In',
//     },
//     animationDuration: { type: Number, default: 800 },
//   },
//   { timestamps: true }
// );

// // ==========================================
// // ✅ INDEXES (for fast queries)
// // ==========================================
// BannerSchema.index({ isActive: 1, order: 1 });
// BannerSchema.index({ 'showOnPages.home': 1, isActive: 1, order: 1 });

// // ==========================================
// // ✅ VALIDATION HOOK
// // ==========================================
// BannerSchema.pre('validate', function () {
//   // Validate linkType matches required field
//   if (this.linkType === 'Category' && !this.categoryId) {
//     throw new Error('categoryId is required when linkType is "Category"');
//   }
//   if (this.linkType === 'Product' && !this.productId) {
//     throw new Error('productId is required when linkType is "Product"');
//   }
//   if (this.linkType === 'Custom URL' && !this.customUrl) {
//     throw new Error('customUrl is required when linkType is "Custom URL"');
//   }

//   // Validate date range
//   if (this.startDate && this.endDate && this.endDate <= this.startDate) {
//     throw new Error('endDate must be after startDate');
//   }
// });

// // ==========================================
// // ✅ VIRTUALS
// // ==========================================
// BannerSchema.virtual('hasButton').get(function () {
//   return !!(this.button?.text && this.button.text.trim());
// });

// BannerSchema.set('toJSON', { virtuals: true });
// BannerSchema.set('toObject', { virtuals: true });

// export default mongoose.model('Banner', BannerSchema);















//  new version for custom add
// backend/models/Banner.js
import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFO
    // ==========================================
    title: { type: String, required: true, trim: true },
    bannerType: {
      type: String,
      enum: ['Hero Large', 'Hero Small', 'Sidebar', 'Popup'],
      default: 'Hero Large',
    },
    image: { type: String, required: true },
    altText: { type: String, default: '' },
    order: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },

    // ==========================================
    // LINK TARGET
    // ==========================================
    linkType: {
      type: String,
      enum: ['Category', 'Product', 'Custom URL', 'None'],
      default: 'None',
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    customUrl: { type: String, default: '' },

    // ==========================================
    // BUTTON CUSTOMIZATION
    // ==========================================
    button: {
      text: { type: String, default: 'Shop Now', trim: true },

      // ✅ Drag position (% of banner)
      x: { type: Number, default: 50, min: 0, max: 100 },
      y: { type: Number, default: 50, min: 0, max: 100 },

      // ✅ Pixel size — used when size === 'Custom'
      width:  { type: Number, default: 160, min: 20, max: 1200 },
      height: { type: Number, default: 48,  min: 16, max: 400  },

      // ✅ Size preset (Custom allowed)
      size: {
        type: String,
        enum: ['Small', 'Medium', 'Large', 'Custom'],
        default: 'Medium',
        set: (v) => {
          if (!v) return 'Medium';
          const s = String(v).trim().toLowerCase();
          const map = {
            small: 'Small',
            medium: 'Medium',
            large: 'Large',
            custom: 'Custom',
          };
          return map[s] || 'Medium';
        },
      },

      // Legacy — kept for backward compatibility
      position: {
        type: String,
        enum: [
          'Bottom Left', 'Bottom Center', 'Bottom Right',
          'Center', 'Center Left', 'Center Right',
          'Top Left', 'Top Right',
        ],
        default: 'Center',
      },

      style: {
        type: String,
        enum: ['Solid', 'Outline', 'Ghost'],
        default: 'Solid',
      },

      bgColor: {
        type: String,
        default: '#0f5a2e',
        match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
      },
      textColor: {
        type: String,
        default: '#ffffff',
        match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
      },
      hoverBgColor: {
        type: String,
        default: '#0a4221',
        match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
      },

      borderRadius: {
        type: String,
        enum: ['none', 'sm', 'md', 'lg', 'full'],
        default: 'md',
      },

      showArrow: { type: Boolean, default: true },
    },

    // ==========================================
    // ✅ BADGE (your UI sends this)
    // ==========================================
    badge: {
      enabled: { type: Boolean, default: false },
      text:    { type: String, default: '50% OFF', trim: true },
      x:       { type: Number, default: 82, min: 0, max: 100 },
      y:       { type: Number, default: 22, min: 0, max: 100 },
      bgColor: {
        type: String,
        default: '#dc2626',
        match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
      },
      textColor: {
        type: String,
        default: '#FFFFFF',
        match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
      },
      shape: {
        type: String,
        enum: ['pill', 'rounded', 'square'],
        default: 'pill',
      },
      fontSize: { type: Number, default: 14, min: 8, max: 72 },
      paddingX: { type: Number, default: 14, min: 0, max: 100 },
      paddingY: { type: Number, default: 6,  min: 0, max: 100 },
    },

    // ==========================================
    // OVERLAY
    // ==========================================
    overlayType: {
      type: String,
      enum: ['Light', 'Dark', 'None'],
      default: 'Dark',
    },
    overlayOpacity: {
      type: Number,
      min: 0,
      max: 100,
      default: 30,
    },

    // ==========================================
    // DISPLAY SETTINGS
    // ==========================================
    showOnDesktop: { type: Boolean, default: true },
    showOnTablet:  { type: Boolean, default: true },
    showOnMobile:  { type: Boolean, default: true },

    startDate: { type: Date, default: null },
    endDate:   { type: Date, default: null },

    showOnPages: {
      home:     { type: Boolean, default: true },
      shop:     { type: Boolean, default: false },
      category: { type: Boolean, default: false },
      product:  { type: Boolean, default: false },
    },

    // ==========================================
    // ANIMATION & LAYOUT
    // ==========================================
    marginTop:    { type: Number, default: 0 },
    marginBottom: { type: Number, default: 0 },
    animation: {
      type: String,
      enum: ['Fade In', 'Slide Up', 'None'],
      default: 'Fade In',
    },
    animationDuration: { type: Number, default: 800 },
  },
  { timestamps: true }
);

// ==========================================
// INDEXES
// ==========================================
BannerSchema.index({ isActive: 1, order: 1 });
BannerSchema.index({ 'showOnPages.home': 1, isActive: 1, order: 1 });

// ==========================================
// VALIDATION HOOK
// (⚠️ NO customSize check — that was the bug)
// ==========================================
BannerSchema.pre('validate', function () {
  if (this.linkType === 'Category' && !this.categoryId) {
    throw new Error('categoryId is required when linkType is "Category"');
  }
  if (this.linkType === 'Product' && !this.productId) {
    throw new Error('productId is required when linkType is "Product"');
  }
  if (this.linkType === 'Custom URL' && !this.customUrl) {
    throw new Error('customUrl is required when linkType is "Custom URL"');
  }

  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    throw new Error('endDate must be after startDate');
  }
});

// ==========================================
// VIRTUALS
// ==========================================
BannerSchema.virtual('hasButton').get(function () {
  return !!(this.button?.text && this.button.text.trim());
});

BannerSchema.virtual('button.resolvedSize').get(function () {
  const size = this.button?.size || 'Medium';

  if (size === 'Custom') {
    return {
      width:    this.button.width  ?? 160,
      height:   this.button.height ?? 48,
      isCustom: true,
    };
  }

  const preset = {
    Small:  { width: 120, height: 40 },
    Medium: { width: 160, height: 48 },
    Large:  { width: 200, height: 56 },
  };

  return { ...(preset[size] || preset.Medium), isCustom: false };
});

BannerSchema.set('toJSON', { virtuals: true });
BannerSchema.set('toObject', { virtuals: true });

export default mongoose.model('Banner', BannerSchema);