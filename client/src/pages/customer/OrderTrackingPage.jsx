import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';

/**
 * Legacy standalone OrderTrackingPage.
 * Order tracking is now fully integrated into the Contact page (/contact?tab=track).
 * This component forwards any legacy routes/bookmarks/emails to the integrated tracker preserving query parameters.
 */
export const OrderTrackingPage = () => {
  const location = useLocation();
  const search = location.search;
  const target = search
    ? `/contact?tab=track&${search.replace(/^\?/, '')}`
    : '/contact?tab=track';

  return <Navigate to={target} replace />;
};

export default OrderTrackingPage;
