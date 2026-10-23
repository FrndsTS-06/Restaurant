import React from 'react';
import { FoodZoomViewer } from './FoodZoomViewer';

/**
 * ImageZoomModal — Aliased wrapper for FoodZoomViewer
 * Maintained for backward compatibility across existing views and tests.
 */
export const ImageZoomModal = (props) => {
  return <FoodZoomViewer {...props} />;
};

export { FoodZoomViewer };
export default FoodZoomViewer;
